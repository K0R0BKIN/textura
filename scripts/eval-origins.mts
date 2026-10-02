// Scores the origin prompt on a fixed set of words: rewrites each word's
// etymologies the way the editor does, then checks every rewrite against its
// Wiktionary source. Nothing is saved.
//
//   node --env-file=.env.local --conditions=react-server --import tsx \
//     scripts/eval-origins.mts [words…]
//
// The judge here is separate from the editor's own checks, which already
// drop sentences they can't verify; it reports what got through anyway.
//
// RUNS repeats the set to show how much results vary between runs, MODEL
// rewrites with another model than the editor's, and OUT writes every rewrite
// and check to a JSON file.

import { writeFileSync } from 'node:fs';
import { noul, TypeSafeClient } from '@typesafe-ai/sdk';
import { and, eq } from 'drizzle-orm';
import { drizzleDb } from '../lib/db';
import { articles } from '../lib/db/schema';
import { fromStoredArticle } from '../lib/db/stored-article';
import { editOrigins, originItems } from '../lib/editing/edit-origins';

// Common words with several etymologies, borrowings, coinages, and uncertain
// origins. None of them appear in the prompt's examples.
const testWords = [
  ...['take', 'set', 'head', 'light', 'ring', 'word', 'go', 'run', 'cool'],
  ...['line', 'play', 'bank', 'check', 'nice', 'sky', 'awful', 'girl'],
  ...['algebra', 'coffee', 'ketchup', 'tea', 'shampoo', 'pajamas'],
  ...['chocolate', 'zero', 'sandwich', 'quark', 'laser', 'google'],
  ...['fog', 'jazz'],
];

// Length follows the source, but past this an etymology is no longer a short
// story.
const maxLength = 600;

const jev = new TypeSafeClient({
  apiKey: process.env.TYPESAFEAI_API_KEY,
  timeout: 30_000,
  retry: { maxRetries: 2 },
});
const checks = {
  added: noul(
    'Does `rewrite` state anything that `source` does not: a fact, word, language, date, person, or meaning? Rewording, summarizing, and leaving things out do not count, and neither does referring to the same word\'s other etymologies in `otherSources`, such as "from the noun".',
  ),
  certainty: noul(
    'Does `rewrite` change how certain a claim is compared with `source`, for example by stating plainly what `source` calls probable, possible, or uncertain, or by hedging what `source` states plainly?',
  ),
};

type Result = {
  word: string;
  source: string;
  rewrite: string;
  ms: number;
  attempts: number;
  dropped: string[];
  issues: string[];
  added: number;
  certainty: number;
};

async function evaluate(word: string): Promise<Result[]> {
  const [row] = await drizzleDb
    .select()
    .from(articles)
    .where(and(eq(articles.headword, word), eq(articles.variety, 'en-US')))
    .limit(1);
  if (!row) throw new Error(`${word} not found`);
  const article = fromStoredArticle(row);
  const sources = new Map(
    article.etymons.map((etymon, e) => [`o${e + 1}`, etymon.origin ?? '']),
  );

  const started = Date.now();
  const rewrites = await editOrigins(
    article.headword,
    originItems(article),
    process.env.MODEL,
  );
  const ms = Date.now() - started;
  return Promise.all(
    rewrites.map(async ({ id, text: rewrite, attempts, dropped }) => {
      const source = sources.get(id)!;
      const { answers } = await jev.systemOne({
        state: {
          source,
          otherSources: [...sources]
            .filter(([other, text]) => other !== id && text)
            .map(([, text]) => text),
          rewrite,
        },
        questions: checks,
      });
      const issues = [
        /\*\*|_[^_\n]+_|`/.test(rewrite) && 'formatting other than italics',
        // A `*` left after removing italics marks a reconstructed form.
        /\bProto-|\*/.test(rewrite.replace(/\*[^*\n]+\*/g, '')) &&
          'reconstructed form',
        rewrite.length > maxLength && `long (${rewrite.length})`,
        answers.added.noul > 0.5 &&
          `adds to source (${answers.added.noul.toFixed(2)})`,
        answers.certainty.noul > 0.5 &&
          `changes certainty (${answers.certainty.noul.toFixed(2)})`,
      ].filter((issue): issue is string => Boolean(issue));
      return {
        word,
        source,
        rewrite,
        ms,
        attempts,
        dropped,
        issues,
        added: answers.added.noul,
        certainty: answers.certainty.noul,
      };
    }),
  );
}

// Runs at most `limit` tasks at once, keeping results in input order.
async function pool<T, R>(
  items: T[],
  limit: number,
  run: (item: T) => Promise<R>,
) {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await run(items[i]);
      }
    }),
  );
  return results;
}

const words = process.argv.length > 2 ? process.argv.slice(2) : testWords;
const runs = Number(process.env.RUNS ?? 1);
const all: Result[][] = [];

for (let run = 1; run <= runs; run++) {
  const results = (await pool(words, 6, evaluate)).flat();
  all.push(results);

  for (const r of results.filter((r) => r.issues.length > 0)) {
    console.log(`${r.word}: ${r.issues.join(', ')}\n  ${r.rewrite}\n`);
  }
  // What the editor's own checks left out, to spot sentences dropped wrongly.
  for (const r of results.filter((r) => r.dropped.length > 0)) {
    console.log(`${r.word}: dropped\n  ${r.dropped.join('\n  ')}\n`);
  }
  const count = (match: string) =>
    results.filter((r) => r.issues.some((i) => i.startsWith(match))).length;
  const lengths = results.map((r) => r.rewrite.length).sort((a, b) => a - b);
  // One time per word, since a word's origins are rewritten together.
  const times = [...new Map(results.map((r) => [r.word, r.ms])).values()].sort(
    (a, b) => a - b,
  );
  const clean = results.filter((r) => r.issues.length === 0).length;
  const retried = results.filter((r) => r.attempts > 1).length;
  const dropped = results.reduce((n, r) => n + r.dropped.length, 0);
  const empty = results.filter((r) => r.rewrite === '').length;
  console.log(
    `run ${run}: ${clean}/${results.length} origins clean | ` +
      `adds to source ${count('adds')}, changes certainty ${count('changes')}, ` +
      `reconstructed ${count('reconstructed')}, long ${count('long')} | ` +
      `length median ${lengths[Math.floor(lengths.length / 2)]}, ` +
      `max ${lengths.at(-1)} | time median ` +
      `${(times[Math.floor(times.length / 2)] / 1000).toFixed(1)} s, ` +
      `max ${(times.at(-1)! / 1000).toFixed(1)} s | ` +
      `rewritten again ${retried}, sentences dropped ${dropped}, ` +
      `origins left empty ${empty}\n`,
  );
}

if (process.env.OUT)
  writeFileSync(process.env.OUT, JSON.stringify(all, null, 2));
process.exit(0);
