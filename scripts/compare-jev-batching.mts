// Compares Jev importance scores asked one sense per request (as the editing
// pipeline does) with one request per part of speech that asks about every
// sense at once.
//
//   BATCH=10 node --env-file=.env.local --conditions=react-server --import tsx \
//     scripts/compare-jev-batching.mts take run set
//
// BATCH limits how many senses one request asks about; by default, all of a
// part of speech's senses.

import { writeFileSync } from 'node:fs';
import { score, TypeSafeClient } from '@typesafe-ai/sdk';
import { and, eq } from 'drizzle-orm';
import { drizzleDb } from '../lib/db';
import { articles } from '../lib/db/schema';
import { fromStoredArticle } from '../lib/db/stored-article';
import type { Sense } from '../lib/schemas';

const jev = new TypeSafeClient({
  apiKey: process.env.TYPESAFEAI_API_KEY,
  timeout: 30_000,
  retry: { maxRetries: 2 },
});

const levels = [
  'Not at all: obsolete, archaic, or found only in old texts',
  'Hardly: rare, regional, or confined to a narrow technical or specialist field',
  'Somewhat: occasionally met; useful but not essential',
  'Important: regularly met in everyday reading, conversation, or media',
  'Essential: among the first meanings anyone needs for this word',
] as const;
const importance = (path: string) =>
  score(
    `How important is it for an everyday reader to know this meaning of \`word\`, as given in \`${path}.definition\`?`,
    levels,
  );
const shownFrom = 2;
const batchSize = Number(process.env.BATCH ?? Infinity);

type Flat = { definition: string; parentDefinition?: string; example?: string };

function flatten(senses: Sense[], parent?: Sense): Flat[] {
  return senses.flatMap((sense) => [
    {
      definition: sense.definition,
      ...(parent && { parentDefinition: parent.definition }),
      ...(sense.examples[0] && { example: sense.examples[0] }),
    },
    ...flatten(sense.subsenses, sense),
  ]);
}

async function timed<T>(run: () => Promise<T>) {
  const started = Date.now();
  const value = await run();
  return { value, ms: Date.now() - started };
}

// Spearman's rank correlation, with tied values sharing their average rank.
function spearman(a: number[], b: number[]) {
  const ranks = (xs: number[]) => {
    const order = xs.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]);
    const result = new Array<number>(xs.length);
    for (let i = 0; i < order.length;) {
      let j = i;
      while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
      for (let k = i; k <= j; k++) result[order[k][1]] = (i + j) / 2;
      i = j + 1;
    }
    return result;
  };
  const [ra, rb] = [ranks(a), ranks(b)];
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const [ma, mb] = [mean(ra), mean(rb)];
  let cov = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < ra.length; i++) {
    cov += (ra[i] - ma) * (rb[i] - mb);
    va += (ra[i] - ma) ** 2;
    vb += (rb[i] - mb) ** 2;
  }
  return va === 0 || vb === 0 ? NaN : cov / Math.sqrt(va * vb);
}

const results: unknown[] = [];

for (const word of process.argv.slice(2)) {
  const [row] = await drizzleDb
    .select()
    .from(articles)
    .where(and(eq(articles.headword, word), eq(articles.variety, 'en-US')))
    .limit(1);
  if (!row) {
    console.log(`${word}: not found`);
    continue;
  }
  const article = fromStoredArticle(row);
  const lexemes = article.etymons
    .flatMap((etymon) => etymon.lexemes)
    .map((lexeme) => ({
      partOfSpeech: lexeme.lexicalCategory,
      senses: flatten(lexeme.senses),
    }));

  // One request per sense, all at once, as in the pipeline.
  const single = await timed(() =>
    Promise.all(
      lexemes.map(({ partOfSpeech, senses }) =>
        Promise.all(
          senses.map(async (sense) => {
            const { answers } = await jev.systemOne({
              state: { word, partOfSpeech, sense },
              questions: { importance: importance('sense') },
            });
            return answers.importance.score;
          }),
        ),
      ),
    ),
  );

  // One request per part of speech, or per batch of BATCH senses within it.
  const batches = lexemes.flatMap(({ partOfSpeech, senses }) =>
    Array.from({ length: Math.ceil(senses.length / batchSize) }, (_, k) => ({
      partOfSpeech,
      senses: senses.slice(k * batchSize, (k + 1) * batchSize),
    })),
  );
  const batched = await timed(async () => {
    const scores = await Promise.all(
      batches.map(async ({ partOfSpeech, senses }) => {
        const { answers } = await jev.systemOne({
          state: { word, partOfSpeech, senses },
          questions: Object.fromEntries(
            senses.map((_, i) => [`s${i}`, importance(`senses[${i}]`)]),
          ),
        });
        return senses.map((_, i) => answers[`s${i}`].score);
      }),
    );
    // Regroup by part of speech.
    let next = 0;
    return lexemes.map(({ senses }) => {
      const parts: number[] = [];
      while (parts.length < senses.length) parts.push(...scores[next++]);
      return parts;
    });
  });

  const a = single.value.flat();
  const b = batched.value.flat();
  const definitions = lexemes.flatMap(({ partOfSpeech, senses }) =>
    senses.map((sense) => `${partOfSpeech}: ${sense.definition}`),
  );
  const flips = a.flatMap((x, i) =>
    x >= shownFrom !== b[i] >= shownFrom ? [i] : [],
  );
  const meanDiff = a.reduce((s, x, i) => s + Math.abs(x - b[i]), 0) / a.length;
  // Rank agreement within each part of speech, where ranking matters.
  const rhos = lexemes.flatMap((_, l) =>
    single.value[l].length >= 4
      ? [spearman(single.value[l], batched.value[l])]
      : [],
  );

  console.log(
    `${word}: ${a.length} senses | requests ${a.length} → ${batches.length} | ` +
      `${(single.ms / 1000).toFixed(1)} s → ${(batched.ms / 1000).toFixed(1)} s | ` +
      `rank agreement ${rhos.length ? rhos.map((r) => r.toFixed(2)).join(', ') : 'n/a'} | ` +
      `mean |diff| ${meanDiff.toFixed(2)} | shown/hidden flips ${flips.length}`,
  );
  for (const i of flips.slice(0, 4)) {
    console.log(
      `    ${a[i].toFixed(1)} → ${b[i].toFixed(1)}  ${definitions[i].slice(0, 90)}`,
    );
  }
  results.push({
    word,
    definitions,
    single: a,
    batched: b,
    ms: [single.ms, batched.ms],
  });
}

const out = process.env.OUT;
if (out) writeFileSync(out, JSON.stringify(results, null, 2));
process.exit(0);
