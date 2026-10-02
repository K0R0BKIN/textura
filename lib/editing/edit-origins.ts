import 'server-only';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import type { Article } from '@/lib/schemas';
import { checkSentence } from './verify-origin';

// Rewrites a word's etymologies in Textura's style and checks every sentence
// against the Wiktionary source before it's shown. An etymology with a
// failing sentence is rewritten once more; sentences that still fail are left
// out, so the reader may get less, but never something the source doesn't
// say.

const model = 'gpt-6-luna';
const attempts = 2;

const prompt = readFileSync(
  join(process.cwd(), 'prompts', 'edit-origin.md'),
  'utf8',
);

// Origins aren't streamed, so a stalled request simply times out and is
// retried by the client.
const openai = new OpenAI({ timeout: 15_000, maxRetries: 2 });

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

export type EditedOrigin = {
  id: string;
  text: string;
  attempts: number;
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

async function rewrite(
  headword: string,
  items: OriginItem[],
  editModel: string,
) {
  const response = await openai.responses.parse({
    model: editModel,
    instructions: prompt,
    input: JSON.stringify({ headword, items }),
    reasoning: { effort: 'none' },
    text: { format: zodTextFormat(OutputSchema, 'origins') },
  });
  return new Map(
    (response.output_parsed?.items ?? []).map((item) => [
      item.id,
      item.sentences,
    ]),
  );
}

export async function editOrigins(
  headword: string,
  items: OriginItem[],
  editModel = model,
): Promise<EditedOrigin[]> {
  const done = new Map<string, EditedOrigin>();
  let pending = items;

  for (let attempt = 1; pending.length > 0; attempt++) {
    const output = await rewrite(headword, pending, editModel);
    const checked = await Promise.all(
      pending.map(async (item) => {
        const sentences = output.get(item.id) ?? [];
        const otherSources = items
          .filter((other) => other.id !== item.id)
          .map((other) => other.text);
        const checks = await Promise.all(
          sentences.map((sentence) =>
            checkSentence(headword, sentence, item.text, otherSources),
          ),
        );
        return { item, sentences, checks };
      }),
    );

    pending = [];
    for (const { item, sentences, checks } of checked) {
      const passed = sentences.filter((_, i) => checks[i].ok);
      const dropped = sentences.flatMap((sentence, i) => {
        const check = checks[i];
        return check.ok ? [] : [`${sentence.text} (${check.reason})`];
      });
      const clean = sentences.length > 0 && dropped.length === 0;
      if (clean || attempt === attempts) {
        done.set(item.id, {
          id: item.id,
          text: passed.map((sentence) => sentence.text).join(' '),
          attempts: attempt,
          dropped,
        });
      } else {
        pending.push(item);
      }
    }
  }

  return items.map((item) => done.get(item.id)!);
}
