import 'server-only';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSONParser } from '@streamparser/json';
import { score, TypeSafeClient } from '@typesafe-ai/sdk';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { editOrigins, originItems, type OriginItem } from './edit-origins';
import type {
  Article,
  EditedArticle,
  EditedSense,
  EditStreamMessage,
  Sense,
} from '@/lib/schemas';

// Edits a Wiktionary article into Textura's style. Jev rates each sense's
// importance, which orders the senses and decides which are shown up front; the article is then rewritten in
// parallel chunks cut in display order, and their text is emitted in that
// order so the article can be read top to bottom while it streams.

const model = 'gpt-6-luna';

// Items are packed into chunks of about this many output tokens, each a
// parallel request. The first chunk of shown senses is smaller: the reader
// waits on it live, while later chunks are ready by the time they're needed.
const chunkTokens = 300;
const firstChunkTokens = 60;

// OpenAI streams often stall (about 5–10% of requests in testing), before any
// output or even after all of it. A request that sends nothing for this long
// is given up on, and one that stalled before any output is retried.
const stallTimeout = 5_000;
const stallRetries = 2;

// Articles with this many senses or fewer show all of them up front.
const showAllUpTo = 3;

// Senses at least this important are shown up front; the rest go behind
// "show more".
const shownFrom = 2;

const prompt = readFileSync(
  join(process.cwd(), 'prompts', 'edit-senses.md'),
  'utf8',
);

const openai = new OpenAI();
const jev = new TypeSafeClient({
  apiKey: process.env.TYPESAFEAI_API_KEY,
  // Jev is either fast or down, so fail fast rather than wait.
  timeout: 5_000,
  retry: { maxRetries: 2 },
});

const importance = score(
  'How important is it for an everyday reader to know this meaning of `word`, as given in `sense.definition`?',
  [
    'Not at all: obsolete, archaic, or found only in old texts',
    'Hardly: rare, regional, or confined to a narrow technical or specialist field',
    'Somewhat: occasionally met; useful but not essential',
    'Important: regularly met in everyday reading, conversation, or media',
    'Essential: among the first meanings anyone needs for this word',
  ],
);

const OutputSchema = z.object({
  items: z.array(z.object({ id: z.string(), text: z.string() })),
});

type RankedSense = {
  id: string;
  source: Sense;
  importance: number;
  shown: boolean;
  subsenses: RankedSense[];
};

type InputItem =
  | { id: string; kind: 'origin'; text: string; partsOfSpeech: string[] }
  | {
      id: string;
      kind: 'sense';
      partOfSpeech: string;
      parentId?: string;
      definition: string;
      examples: string[];
      groupsSubsenses: boolean;
    };

function flatten(senses: RankedSense[]): RankedSense[] {
  return senses.flatMap((sense) => [sense, ...flatten(sense.subsenses)]);
}

// Item ids are `<part of speech>:<path>`, such as `2:1.3`.
function withIds(senses: Sense[], prefix: string): RankedSense[] {
  return senses.map((source, index) => {
    const id = `${prefix}${index + 1}`;
    return {
      id,
      source,
      importance: 0,
      shown: false,
      subsenses: withIds(source.subsenses, `${id}.`),
    };
  });
}

function parentId(id: string) {
  const dot = id.lastIndexOf('.');
  return dot === -1 ? undefined : id.slice(0, dot);
}

// Orders siblings by importance (stable). A parent takes the highest
// importance among its descendants, so an important subsense lifts its group.
function rank(senses: RankedSense[]): RankedSense[] {
  for (const sense of senses) {
    sense.subsenses = rank(sense.subsenses);
    sense.importance = Math.max(
      sense.importance,
      ...sense.subsenses.map((s) => s.importance),
    );
  }
  return senses.toSorted((a, b) => b.importance - a.importance);
}

function markShown(senses: RankedSense[], parentShown = true) {
  for (const sense of senses) {
    sense.shown = parentShown && sense.importance >= shownFrom;
    markShown(sense.subsenses, sense.shown);
  }
}

function markAllShown(senses: RankedSense[]) {
  for (const sense of flatten(senses)) sense.shown = true;
}

// Rough output size of an item: a rewritten definition or a condensed
// etymology, plus JSON.
function estimateTokens(item: InputItem) {
  return item.kind === 'origin'
    ? Math.min(item.text.length / 8, 150) + 20
    : item.definition.length / 4 + 15;
}

function toChunks(items: InputItem[], firstBudget = chunkTokens) {
  const chunks: InputItem[][] = [];
  let size = 0;
  for (const item of items) {
    const itemSize = estimateTokens(item);
    const budget = chunks.length === 1 ? firstBudget : chunkTokens;
    if (chunks.length === 0 || size + itemSize > budget) {
      chunks.push([]);
      size = 0;
    }
    chunks.at(-1)!.push(item);
    size += itemSize;
  }
  return chunks;
}

// A buffered async queue: producers push while it's being read or before,
// and the reader gets everything in order.
function channel<T>() {
  const buffer: T[] = [];
  let closed = false;
  let failure: unknown;
  let wake: (() => void) | undefined;
  return {
    push(value: T) {
      buffer.push(value);
      wake?.();
    },
    close(error?: unknown) {
      closed = true;
      failure = error;
      wake?.();
    },
    async *[Symbol.asyncIterator]() {
      while (true) {
        if (buffer.length > 0) {
          yield buffer.shift()!;
          continue;
        }
        if (closed) {
          if (failure) throw failure;
          return;
        }
        await new Promise<void>((resolve) => (wake = resolve));
        wake = undefined;
      }
    },
  };
}

// Rewrites one chunk, pushing text as it streams in. Throws when the output
// doesn't contain exactly the chunk's items, in order.
async function editChunk(
  headword: string,
  chunk: InputItem[],
  byId: Map<string, InputItem>,
  push: (message: EditStreamMessage) => void,
) {
  const ids = new Set(chunk.map((item) => item.id));
  // Parents rewritten in another chunk, sent for context only.
  const context = [
    ...new Set(
      chunk.flatMap((item) =>
        item.kind === 'sense' && item.parentId && !ids.has(item.parentId)
          ? [item.parentId]
          : [],
      ),
    ),
  ].map((id) => byId.get(id)!);

  const input = JSON.stringify({
    headword,
    ...(context.length > 0 && { context }),
    items: chunk,
  });

  // A stall before any output is retried, unseen by the reader. After text
  // has been sent, a retry would rewrite it, so the chunk fails instead.
  let items = await requestChunk(input, ids, push);
  for (let retry = 1; retry <= stallRetries; retry++) {
    if (items !== 'stalled before output') break;
    items = await requestChunk(input, ids, push);
  }
  if (items === 'stalled before output') {
    throw new Error('Editing stalled');
  }

  const actual = items.map((item) => item.id);
  const expected = chunk.map((item) => item.id);
  if (
    actual.length !== expected.length ||
    actual.some((id, k) => id !== expected[k])
  ) {
    throw new Error(
      `Edited chunk doesn't match its input: expected [${expected}], got [${actual}]`,
    );
  }
  return items;
}

// One request for a chunk, pushing text as it streams in. It's done as soon
// as the output's JSON is complete: OpenAI streams sometimes stall after that,
// or append stray text.
async function requestChunk(
  input: string,
  ids: Set<string>,
  push: (message: EditStreamMessage) => void,
): Promise<z.infer<typeof OutputSchema>['items'] | 'stalled before output'> {
  const stream = openai.responses.stream({
    model,
    instructions: prompt,
    input,
    reasoning: { effort: 'none' },
    text: { format: zodTextFormat(OutputSchema, 'article') },
  });

  const parser = new JSONParser({
    emitPartialTokens: true,
    emitPartialValues: true,
    paths: ['$.items.*.text'],
  });
  const items: z.infer<typeof OutputSchema>['items'] = [];
  const written = new Map<string, number>();
  parser.onValue = ({ value, parent, partial }) => {
    const id = (parent as { id?: string } | undefined)?.id;
    if (typeof value !== 'string' || !id || !ids.has(id)) return;
    const previous = written.get(id) ?? 0;
    if (value.length > previous) {
      push({ type: 'text', id, text: value.slice(previous) });
      written.set(id, value.length);
    }
    if (!partial) {
      push({ type: 'end', id });
      items.push({ id, text: value });
    }
  };

  let started = false;
  const outcome = new Promise<'complete' | 'malformed'>((resolve) => {
    parser.onEnd = () => resolve('complete');
    stream.on('response.output_text.delta', ({ delta }) => {
      if (parser.isEnded) return;
      started ||= delta.trim() !== '';
      try {
        parser.write(delta);
      } catch {
        resolve('malformed');
      }
    });
  });

  let timer: NodeJS.Timeout | undefined;
  const stalled = new Promise<'stalled'>((resolve) => {
    const restart = () => {
      clearTimeout(timer);
      timer = setTimeout(() => resolve('stalled'), stallTimeout);
    };
    restart();
    stream.on('event', restart);
  });
  // Errors, or a response that ends before its JSON does.
  const failed = stream.finalResponse().then(
    () => {
      throw new Error('Edited chunk ended before its output was complete');
    },
    (error: unknown) => {
      throw error;
    },
  );

  try {
    const result = await Promise.race([outcome, stalled, failed]);
    if (result === 'complete') return items;
    if (result === 'malformed') throw new Error('Edited chunk is malformed');
    if (!started) return 'stalled before output';
    throw new Error('Editing stalled partway through');
  } finally {
    clearTimeout(timer);
    failed.catch(() => {});
    stream.abort();
  }
}

// Starts rewriting a chunk right away; its text queues up until relayed.
function startChunk(
  headword: string,
  chunk: InputItem[],
  byId: Map<string, InputItem>,
) {
  const queue = channel<EditStreamMessage>();
  const result = editChunk(headword, chunk, byId, queue.push).then(
    (edited) => {
      queue.close();
      return edited;
    },
    (error) => {
      queue.close(error);
      throw error;
    },
  );
  // Errors surface through the queue; don't also leave them unhandled.
  result.catch(() => {});
  return { queue, result };
}

// Starts rewriting a word's etymologies, with a queue per etymology so each
// can be relayed at its own place in the article. Each is checked against its
// source first, so its text arrives whole.
function startOrigins(headword: string, items: OriginItem[]) {
  const queues = new Map(
    items.map((item) => [item.id, channel<EditStreamMessage>()]),
  );
  const result =
    items.length === 0
      ? Promise.resolve([])
      : editOrigins(headword, items).then(
          (origins) => {
            for (const { id, text } of origins) {
              const queue = queues.get(id)!;
              if (text) queue.push({ type: 'text', id, text });
              queue.push({ type: 'end', id });
              queue.close();
            }
            return origins.map(({ id, text }) => ({ id, text }));
          },
          (error: unknown) => {
            for (const queue of queues.values()) queue.close(error);
            throw error;
          },
        );
  return new Map(
    items.map(({ id }) => {
      const part = result.then((edited) =>
        edited.filter((item) => item.id === id),
      );
      // Errors surface through the queue; don't also leave them unhandled.
      part.catch(() => {});
      return [id, { queue: queues.get(id)!, result: part }];
    }),
  );
}

export async function editArticle(
  article: Article,
  send: (message: EditStreamMessage) => void,
): Promise<EditedArticle> {
  const word = article.headword;

  // Etymologies don't depend on the sense order, so rewrite them while Jev
  // ranks the senses: all in one request, so each can build on the others.
  const originList = originItems(article);
  const origins = startOrigins(word, originList);

  const lexemes = article.etymons.flatMap((etymon, e) =>
    etymon.lexemes.map((lexeme) => ({
      etymon: e,
      lexeme,
      senses: [] as RankedSense[],
    })),
  );
  lexemes.forEach((entry, i) => {
    entry.senses = withIds(entry.lexeme.senses, `${i + 1}:`);
  });

  // Jev: one small request per sense, all in parallel.
  await Promise.all(
    lexemes.flatMap(({ lexeme, senses }) => {
      const byId = new Map(flatten(senses).map((s) => [s.id, s]));
      return flatten(senses).map(async (sense) => {
        const parentKey = parentId(sense.id);
        const parent = parentKey ? byId.get(parentKey) : undefined;
        const { answers } = await jev.systemOne({
          state: {
            word,
            partOfSpeech: lexeme.lexicalCategory,
            sense: {
              definition: sense.source.definition,
              ...(parent && { parentDefinition: parent.source.definition }),
              ...(sense.source.examples[0] && {
                example: sense.source.examples[0],
              }),
            },
          },
          questions: { importance },
        });
        sense.importance = answers.importance.score;
      });
    }),
  );

  for (const entry of lexemes) entry.senses = rank(entry.senses);
  const best = (senses: RankedSense[]) =>
    Math.max(...senses.map((s) => s.importance));
  const etymons = article.etymons
    .map((etymon, e) => ({
      etymon,
      e,
      lexemes: lexemes
        .filter((l) => l.etymon === e)
        .toSorted((a, b) => best(b.senses) - best(a.senses)),
    }))
    .toSorted((a, b) => best(b.lexemes[0].senses) - best(a.lexemes[0].senses));

  // Shown up front: everything for small articles, otherwise what Jev deems
  // worth showing, and never nothing.
  const allSenses = lexemes.flatMap((l) => flatten(l.senses));
  if (allSenses.length <= showAllUpTo) {
    for (const entry of lexemes) markAllShown(entry.senses);
  } else {
    for (const entry of lexemes) markShown(entry.senses);
    if (!allSenses.some((s) => s.shown)) {
      etymons[0].lexemes[0].senses[0].shown = true;
    }
  }

  const toEdited = (senses: RankedSense[]): EditedSense[] =>
    senses.map((s) => ({
      id: s.id,
      definition: '',
      examples: s.source.examples,
      shown: s.shown,
      subsenses: toEdited(s.subsenses),
    }));
  const outline: EditedArticle = {
    headword: word,
    variety: article.variety,
    etymons: etymons.map(({ etymon, e, lexemes }) => ({
      ...(etymon.origin && { originId: `o${e + 1}`, origin: '' }),
      lexemes: lexemes.map(({ lexeme, senses }) => ({
        lexicalCategory: lexeme.lexicalCategory,
        ...(lexeme.transcription && { transcription: lexeme.transcription }),
        senses: toEdited(senses),
      })),
    })),
  };

  // Items in display order: each etymology with its shown senses, then all
  // hidden senses, so the visible article streams first.
  const senseItem = (partOfSpeech: string, s: RankedSense): InputItem => {
    const parentKey = parentId(s.id);
    return {
      id: s.id,
      kind: 'sense',
      partOfSpeech,
      ...(parentKey && { parentId: parentKey }),
      definition: s.source.definition,
      examples: s.source.examples,
      groupsSubsenses: s.subsenses.length > 0,
    };
  };
  const display = etymons.flatMap(({ e, lexemes }) => [
    ...originList
      .filter((item) => item.id === `o${e + 1}`)
      .map((item) => ({ ...item, kind: 'origin' as const })),
    ...lexemes.flatMap(({ lexeme, senses }) =>
      flatten(senses).map((s) => ({
        item: senseItem(lexeme.lexicalCategory, s),
        shown: s.shown,
      })),
    ),
  ]);
  const items = [
    ...display.flatMap((d) => ('item' in d ? (d.shown ? [d.item] : []) : [d])),
    ...display.flatMap((d) => ('item' in d && !d.shown ? [d.item] : [])),
  ];
  const byId = new Map(items.map((item) => [item.id, item]));

  send({ type: 'outline', article: outline, order: items.map((i) => i.id) });

  // Split into segments in display order: each etymology, already being
  // rewritten, and the runs of senses between them, cut into chunks. Start
  // every chunk now, then relay their text in order: the current chunk
  // streams live while later ones buffer.
  const segments: ReturnType<typeof startChunk>[] = [];
  let firstRun = true;
  let run: InputItem[] = [];
  const flushRun = () => {
    if (run.length === 0) return;
    for (const chunk of toChunks(
      run,
      firstRun ? firstChunkTokens : chunkTokens,
    )) {
      segments.push(startChunk(word, chunk, byId));
    }
    firstRun = false;
    run = [];
  };
  for (const item of items) {
    if (item.kind === 'origin') {
      flushRun();
      segments.push(origins.get(item.id)!);
    } else {
      run.push(item);
    }
  }
  flushRun();
  for (const { queue } of segments) {
    for await (const message of queue) send(message);
  }
  const edited = (await Promise.all(segments.map((c) => c.result))).flat();
  send({ type: 'done' });

  const text = new Map(edited.map((item) => [item.id, item.text]));
  const fill = (senses: EditedSense[]): EditedSense[] =>
    senses.map((s) => ({
      ...s,
      definition: text.get(s.id) ?? '',
      subsenses: fill(s.subsenses),
    }));
  return {
    ...outline,
    etymons: outline.etymons.map((etymon) => ({
      ...etymon,
      ...(etymon.originId && { origin: text.get(etymon.originId) ?? '' }),
      lexemes: etymon.lexemes.map((lexeme) => ({
        ...lexeme,
        senses: fill(lexeme.senses),
      })),
    })),
  };
}
