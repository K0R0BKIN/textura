import 'server-only';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSONParser } from '@streamparser/json';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { editOrigins, originItems, type OriginItem } from './edit-origins';
import { sortLabels, withoutRepeatedLabels } from '@/lib/labels';
import { channel } from './channel';
import { groupFrom, groupSenses, type SenseNode } from './group-senses';
import { hedgedStream } from './hedge';
import type {
  Article,
  EditedArticle,
  EditedSense,
  EditStreamMessage,
  Sense,
} from '@/lib/schemas';

// Edits a Wiktionary article into Textura's style. Every definition is
// rewritten at once, in parallel chunks, while big parts of speech are grouped
// into Oxford's core senses (group-senses.ts). The text is relayed in reading
// order, so the article can be read top to bottom while it streams.

const model = 'gpt-6-luna';

// Items are packed into chunks of about this many output tokens, each a
// parallel request. The first chunk is smaller: in an ungrouped article the
// reader waits on it live, while later chunks are ready by the time they're
// needed.
const chunkTokens = 300;
const firstChunkTokens = 60;

// OpenAI streams often stall (about 5–10% of requests in testing), before any
// output or even after all of it. A request that sends nothing for this long
// is given up on, and one that stalled before any output is retried.
const stallTimeout = 5_000;
const stallRetries = 2;

// A request slower than usual gets a duplicate, and the first to answer
// wins (see hedge.ts): a stream that hasn't produced text after this long,
// or a Jev call that hasn't answered.
const hedgeStreamAfter = 2_500;

// A runaway response (the model looping instead of closing its JSON) stops
// here: far above a chunk's few hundred tokens.
const maxOutputTokens = 2_000;

const prompt = readFileSync(
  join(process.cwd(), 'prompts', 'edit-senses.md'),
  'utf8',
);

const openai = new OpenAI();

const OutputSchema = z.object({
  items: z.array(z.object({ id: z.string(), text: z.string() })),
});

type InputItem = {
  id: string;
  kind: 'sense';
  partOfSpeech: string;
  parentId?: string;
  // Shown before the definition, such as "informal" or "chess".
  labels?: string[];
  // What the sense applies to or is used with, such as "of a person".
  usage?: string[];
  definition: string;
  examples: string[];
  groupsSubsenses: boolean;
};

function flatten(senses: SenseNode[]): SenseNode[] {
  return senses.flatMap((sense) => [sense, ...flatten(sense.subsenses)]);
}

// Item ids are `<part of speech>:<path>`, such as `2:1.3`: a sense's place in
// Wiktionary, which grouping doesn't change.
function withIds(senses: Sense[], prefix: string): SenseNode[] {
  return senses.map((source, index) => {
    const id = `${prefix}${index + 1}`;
    return { id, source, subsenses: withIds(source.subsenses, `${id}.`) };
  });
}

function parentId(id: string) {
  const dot = id.lastIndexOf('.');
  return dot === -1 ? undefined : id.slice(0, dot);
}

// Rough output size of an item: a rewritten definition, plus JSON.
function estimateTokens(item: InputItem) {
  return item.definition.length / 4 + 15;
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
        item.parentId && !ids.has(item.parentId) ? [item.parentId] : [],
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
  const labels = new Map(chunk.map((item) => [item.id, item.labels ?? []]));
  let items = await requestChunk(input, ids, labels, push);
  for (let retry = 1; retry <= stallRetries; retry++) {
    if (items !== 'stalled before output') break;
    items = await requestChunk(input, ids, labels, push);
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
  labels: Map<string, string[]>,
  push: (message: EditStreamMessage) => void,
): Promise<z.infer<typeof OutputSchema>['items'] | 'stalled before output'> {
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
    // Labels are shown separately, so a definition doesn't repeat them.
    const text = withoutRepeatedLabels(value, labels.get(id) ?? [], partial);
    const previous = written.get(id) ?? 0;
    if (text.length > previous) {
      push({ type: 'text', id, text: text.slice(previous) });
      written.set(id, text.length);
    }
    if (!partial) {
      push({ type: 'end', id });
      items.push({ id, text });
      // Done once every item is complete: the model sometimes keeps writing
      // after the useful part instead of closing its JSON.
      if (items.length === ids.size) resolveOutcome('complete');
    }
  };

  let started = false;
  let resolveOutcome!: (outcome: 'complete' | 'malformed') => void;
  const outcome = new Promise<'complete' | 'malformed'>(
    (resolve) => (resolveOutcome = resolve),
  );
  parser.onEnd = () => resolveOutcome('complete');

  let timer: NodeJS.Timeout | undefined;
  let resolveStalled!: (stalled: 'stalled') => void;
  const stalled = new Promise<'stalled'>(
    (resolve) => (resolveStalled = resolve),
  );
  const restartStallTimer = () => {
    clearTimeout(timer);
    timer = setTimeout(() => resolveStalled('stalled'), stallTimeout);
  };

  const response = hedgedStream(
    () =>
      openai.responses.stream({
        model,
        instructions: prompt,
        input,
        reasoning: { effort: 'none' },
        text: { format: zodTextFormat(OutputSchema, 'article') },
        max_output_tokens: maxOutputTokens,
      }),
    hedgeStreamAfter,
    {
      onDelta: (delta) => {
        if (parser.isEnded) return;
        started ||= delta.trim() !== '';
        try {
          parser.write(delta);
        } catch {
          resolveOutcome('malformed');
        }
      },
      onEvent: restartStallTimer,
    },
  );
  restartStallTimer();
  // Errors, or a response that ends before its JSON does.
  const failed = response.ended.then((completed) => {
    throw new Error(
      completed
        ? 'Edited chunk ended before its output was complete'
        : 'Editing request failed',
    );
  });

  try {
    const result = await Promise.race([outcome, stalled, failed]);
    if (result === 'complete') return items;
    if (result === 'malformed') throw new Error('Edited chunk is malformed');
    if (!started) return 'stalled before output';
    throw new Error('Editing stalled partway through');
  } finally {
    clearTimeout(timer);
    failed.catch(() => {});
    response.abort();
  }
}

type Queue = ReturnType<typeof channel<EditStreamMessage>>;

// Starts rewriting a chunk right away. Its text queues up per item until
// relayed, since items are relayed in reading order, which grouping decides.
function startChunk(
  headword: string,
  chunk: InputItem[],
  byId: Map<string, InputItem>,
  queues: Map<string, Queue>,
) {
  const result = editChunk(headword, chunk, byId, (message) => {
    if (message.type !== 'text' && message.type !== 'end') return;
    const queue = queues.get(message.id)!;
    queue.push(message);
    if (message.type === 'end') queue.close();
  }).catch((error: unknown) => {
    for (const item of chunk) queues.get(item.id)!.close(error);
    throw error;
  });
  // Errors surface through the queues; don't also leave them unhandled.
  result.catch(() => {});
  return result;
}

// Starts rewriting a word's etymologies, with a queue per etymology so each
// can be relayed at its own place in the article. Sentences arrive as each is
// verified against the source.
function startOrigins(headword: string, items: OriginItem[]) {
  const queues = new Map(
    items.map((item) => [item.id, channel<EditStreamMessage>()]),
  );
  const result =
    items.length === 0
      ? Promise.resolve([])
      : editOrigins(headword, items, (id, event) => {
          const queue = queues.get(id)!;
          if (event.type === 'text') {
            queue.push({ type: 'text', id, text: event.text });
          } else {
            queue.push({ type: 'end', id });
            queue.close();
          }
        }).then(
          (origins) => origins.map(({ id, text }) => ({ id, text })),
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
  phrases: EditedArticle['phrases'] = [],
): Promise<EditedArticle> {
  const word = article.headword;

  // Etymologies don't depend on the senses: rewrite them all in one request,
  // so each can build on the others.
  const originList = originItems(article);
  const origins = startOrigins(word, originList);

  const lexemes = article.etymons.flatMap((etymon, e) =>
    etymon.lexemes.map((lexeme) => ({
      etymon: e,
      lexeme,
      senses: [] as SenseNode[],
    })),
  );
  lexemes.forEach((entry, i) => {
    entry.senses = withIds(entry.lexeme.senses, `${i + 1}:`);
  });

  // Big parts of speech are grouped into core senses, which stream in as the
  // model writes them. Grouping only changes the order and nesting, so the
  // definitions are rewritten meanwhile.
  const groupings = lexemes.map((entry) =>
    entry.senses.length >= groupFrom
      ? groupSenses(word, entry.lexeme.lexicalCategory, entry.senses)
      : undefined,
  );

  // Every definition, in Wiktionary's order, rewritten in parallel chunks.
  const items: InputItem[] = lexemes.flatMap(({ lexeme, senses }) =>
    flatten(senses).map((sense) => {
      const parentKey = parentId(sense.id);
      const { shown, usage } = sortLabels(sense.source.labels);
      return {
        id: sense.id,
        kind: 'sense' as const,
        partOfSpeech: lexeme.lexicalCategory,
        ...(parentKey && { parentId: parentKey }),
        ...(shown.length > 0 && { labels: shown }),
        ...(usage.length > 0 && { usage }),
        definition: sense.source.definition,
        examples: sense.source.examples,
        groupsSubsenses: sense.subsenses.length > 0,
      };
    }),
  );
  const byId = new Map(items.map((item) => [item.id, item]));
  const queues = new Map<string, Queue>([
    ...items.map((item) => [item.id, channel<EditStreamMessage>()] as const),
    ...[...origins].map(([id, origin]) => [id, origin.queue] as const),
  ]);
  const chunks = toChunks(items, firstChunkTokens).map((chunk) =>
    startChunk(word, chunk, byId, queues),
  );

  // The article's structure with empty text, and its items in reading order.
  const toEdited = (senses: SenseNode[]): EditedSense[] =>
    senses.map((sense) => ({
      id: sense.id,
      labels: sortLabels(sense.source.labels).shown,
      definition: '',
      examples: sense.source.examples,
      subsenses: toEdited(sense.subsenses),
    }));
  const senseIds = (senses: EditedSense[]): string[] =>
    senses.flatMap((sense) => [sense.id, ...senseIds(sense.subsenses)]);
  const outline = () => {
    const edited: EditedArticle = {
      headword: word,
      variety: article.variety,
      phrases,
      etymons: article.etymons.map((etymon, e) => ({
        ...(etymon.origin && { originId: `o${e + 1}`, origin: '' }),
        lexemes: lexemes
          .filter((entry) => entry.etymon === e)
          .map(({ lexeme, senses }) => ({
            lexicalCategory: lexeme.lexicalCategory,
            ...(lexeme.transcription && {
              transcription: lexeme.transcription,
            }),
            senses: toEdited(senses),
          })),
      })),
    };
    const order = edited.etymons.flatMap((etymon) => [
      ...(etymon.originId ? [etymon.originId] : []),
      ...etymon.lexemes.flatMap((lexeme) => senseIds(lexeme.senses)),
    ]);
    return { edited, order };
  };

  const relay = async (ids: string[]) => {
    for (const id of ids) {
      for await (const message of queues.get(id)!) send(message);
    }
  };

  const { edited, order } = outline();
  send({ type: 'outline', article: edited, order });

  // Relay in reading order. A grouped part of speech starts out with its
  // senses in Wiktionary's order and no text; each core sense replaces them as
  // it arrives, and its text follows.
  let next = 0;
  for (const [e, etymon] of edited.etymons.entries()) {
    if (etymon.originId) await relay([etymon.originId]);
    for (const [l, lexeme] of etymon.lexemes.entries()) {
      const grouping = groupings[next++];
      if (!grouping) {
        await relay(senseIds(lexeme.senses));
        continue;
      }
      const cores: EditedSense[] = [];
      for await (const core of grouping) {
        const [sense] = toEdited([core]);
        cores.push(sense);
        send({ type: 'core', etymon: e, lexeme: l, sense });
        await relay(senseIds([sense]));
      }
      lexeme.senses = cores;
    }
  }

  const results = (
    await Promise.all([
      ...chunks,
      ...[...origins.values()].map((origin) => origin.result),
    ])
  ).flat();
  send({ type: 'done' });

  const text = new Map(results.map((item) => [item.id, item.text]));
  const fill = (senses: EditedSense[]): EditedSense[] =>
    senses.map((sense) => ({
      ...sense,
      definition: text.get(sense.id) ?? '',
      subsenses: fill(sense.subsenses),
    }));
  return {
    ...edited,
    etymons: edited.etymons.map((etymon) => ({
      ...etymon,
      ...(etymon.originId && { origin: text.get(etymon.originId) ?? '' }),
      lexemes: etymon.lexemes.map((lexeme) => ({
        ...lexeme,
        senses: fill(lexeme.senses),
      })),
    })),
  };
}
