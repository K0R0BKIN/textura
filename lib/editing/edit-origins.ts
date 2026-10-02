import 'server-only';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSONParser } from '@streamparser/json';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import type { Article } from '@/lib/schemas';
import { hedgedStream } from './hedge';
import { checkSentence, type CitedSentence } from './verify-origin';

// Rewrites a word's etymologies in Textura's style and checks every sentence
// against the Wiktionary source before it's shown. The rewrite streams: each
// sentence is checked as soon as it's complete, while the next is still being
// written, and verified sentences are passed on in order. A sentence that
// fails is left out, so the reader may get less, but never something the
// source doesn't say.

const model = 'gpt-6-luna';

// OpenAI streams sometimes stall. A request that sends nothing for this long
// is given up on: before any output it's retried, after some it ends there.
const stallTimeout = 5_000;
const stallRetries = 1;

// A stream that hasn't produced text after this long gets a duplicate, and
// the first to produce text wins (see hedge.ts).
const hedgeAfter = 2_500;

// A runaway response (the model looping instead of closing its JSON) stops
// here: far above even a long etymology with its quotes.
const maxOutputTokens = 4_000;

const prompt = readFileSync(
  join(process.cwd(), 'prompts', 'edit-origin.md'),
  'utf8',
);

const openai = new OpenAI();

const OutputSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      sentences: z.array(
        z.object({ text: z.string(), quotes: z.array(z.string()) }),
      ),
    }),
  ),
});

export type OriginItem = {
  id: string;
  text: string;
  // So related etymologies can refer to each other ("from the noun").
  partsOfSpeech: string[];
};

// A verified sentence, with a leading space after the first, or the end of an
// etymology.
export type OriginEvent = { type: 'text'; text: string } | { type: 'end' };

export type EditedOrigin = {
  id: string;
  text: string;
  // Sentences left out, with the reason they failed.
  dropped: string[];
};

export function originItems(article: Article): OriginItem[] {
  return article.etymons.flatMap((etymon, e) =>
    etymon.origin
      ? [
          {
            id: `o${e + 1}`,
            text: etymon.origin,
            partsOfSpeech: etymon.lexemes.map((l) => l.lexicalCategory),
          },
        ]
      : [],
  );
}

export async function editOrigins(
  headword: string,
  items: OriginItem[],
  emit: (id: string, event: OriginEvent) => void = () => {},
  editModel = model,
): Promise<EditedOrigin[]> {
  // Per etymology: its verified sentences, in order. Checks run in parallel;
  // `tail` passes their results on in the order the sentences were written.
  const origins = new Map(
    items.map((item) => [
      item.id,
      {
        item,
        otherSources: items
          .filter((other) => other.id !== item.id)
          .map((other) => other.text),
        tail: Promise.resolve(),
        kept: [] as string[],
        dropped: [] as string[],
        ended: false,
      },
    ]),
  );

  const addSentence = (id: string, sentence: CitedSentence) => {
    const origin = origins.get(id);
    if (!origin || origin.ended) return;
    // An unverifiable sentence, even if Jev is down, is left out.
    const check = checkSentence(
      headword,
      sentence,
      origin.item.text,
      origin.otherSources,
    ).catch((error: unknown) => ({
      ok: false as const,
      reason: `check failed: ${error instanceof Error ? error.message : error}`,
    }));
    origin.tail = origin.tail.then(async () => {
      const result = await check;
      if (result.ok) {
        const text = (origin.kept.length > 0 ? ' ' : '') + sentence.text;
        origin.kept.push(sentence.text);
        emit(id, { type: 'text', text });
      } else {
        origin.dropped.push(`${sentence.text} (${result.reason})`);
      }
    });
  };

  const endOrigin = (id: string) => {
    const origin = origins.get(id);
    if (!origin || origin.ended) return;
    origin.ended = true;
    origin.tail = origin.tail.then(() => emit(id, { type: 'end' }));
  };

  const input = JSON.stringify({ headword, items });
  for (let attempt = 0; attempt <= stallRetries; attempt++) {
    const result = await streamRewrite(
      input,
      new Set(items.map((item) => item.id)),
      editModel,
      addSentence,
      endOrigin,
    );
    if (result !== 'stalled before output') break;
  }

  // Whatever the model left out or didn't finish ends with what's verified.
  for (const id of origins.keys()) endOrigin(id);
  await Promise.all([...origins.values()].map((origin) => origin.tail));

  return items.map((item) => {
    const origin = origins.get(item.id)!;
    return {
      id: item.id,
      text: origin.kept.join(' '),
      dropped: origin.dropped,
    };
  });
}

// One streamed request. Calls `addSentence` for each complete sentence and
// `endOrigin` for each complete etymology. It's done as soon as the output's
// JSON is complete, since streams sometimes stall or append stray text after.
async function streamRewrite(
  input: string,
  ids: Set<string>,
  editModel: string,
  addSentence: (id: string, sentence: CitedSentence) => void,
  endOrigin: (id: string) => void,
): Promise<'done' | 'stalled before output'> {
  const parser = new JSONParser({
    paths: ['$.items.*.sentences.*', '$.items.*'],
  });
  const ended = new Set<string>();
  // The parser's stack holds each value's containers: a sentence's etymology
  // is two levels up.
  parser.onValue = ({ value, stack }) => {
    if (stack.length === 4) {
      const id = (stack[3].value as { id?: unknown }).id;
      const sentence = value as Partial<CitedSentence>;
      if (
        typeof id === 'string' &&
        typeof sentence.text === 'string' &&
        Array.isArray(sentence.quotes)
      ) {
        addSentence(id, { text: sentence.text, quotes: sentence.quotes });
      }
    } else if (stack.length === 2) {
      const id = (value as { id?: unknown }).id;
      if (typeof id === 'string') {
        endOrigin(id);
        ended.add(id);
        // Done once every etymology is complete: the model sometimes keeps
        // writing after the useful part instead of closing its JSON.
        if ([...ids].every((other) => ended.has(other))) {
          resolveComplete('done');
        }
      }
    }
  };

  let started = false;
  let resolveComplete!: (done: 'done') => void;
  const complete = new Promise<'done'>(
    (resolve) => (resolveComplete = resolve),
  );
  parser.onEnd = () => resolveComplete('done');

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
        model: editModel,
        instructions: prompt,
        input,
        reasoning: { effort: 'none' },
        text: { format: zodTextFormat(OutputSchema, 'origins') },
        max_output_tokens: maxOutputTokens,
      }),
    hedgeAfter,
    {
      onDelta: (delta) => {
        if (parser.isEnded) return;
        started ||= delta.trim() !== '';
        try {
          parser.write(delta);
        } catch {
          // Malformed output: keep what's verified so far.
          resolveComplete('done');
        }
      },
      onEvent: restartStallTimer,
    },
  );
  restartStallTimer();
  // A response that ends before its JSON does, or fails, ends here too.
  const responseEnded = response.ended.then(() => 'done' as const);

  try {
    const result = await Promise.race([complete, stalled, responseEnded]);
    return result === 'stalled' && !started ? 'stalled before output' : 'done';
  } finally {
    clearTimeout(timer);
    response.abort();
  }
}
