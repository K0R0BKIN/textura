// Scores the definitions the editor writes: edits each test word the way the
// editor does (nothing is saved), then checks every rewritten definition
// against its Wiktionary source. Run with:
//
//   node --env-file=.env.local --conditions=react-server --import tsx \
//     scripts/eval-senses.mts [words…]
//
// Jev judges whether a definition adds to or changes its source; code checks
// Oxford's format. OUT writes every definition and check to a JSON file.

import { writeFileSync } from 'node:fs';
import { noul, TypeSafeClient } from '@typesafe-ai/sdk';
import { and, eq } from 'drizzle-orm';
import { drizzleDb } from '../lib/db';
import { articles } from '../lib/db/schema';
import { fromStoredArticle } from '../lib/db/stored-article';
import { editArticle } from '../lib/editing/edit-article';
import { sortLabels } from '../lib/labels';
import type { EditedSense, Sense } from '../lib/schemas';

// The origin test words plus a few with long, labeled entries.
const testWords = [
  ...['take', 'set', 'head', 'light', 'ring', 'word', 'go', 'run', 'cool'],
  ...['line', 'play', 'bank', 'check', 'nice', 'sky', 'awful', 'girl'],
  ...['algebra', 'coffee', 'ketchup', 'tea', 'shampoo', 'pajamas'],
  ...['chocolate', 'zero', 'sandwich', 'quark', 'laser', 'google'],
  ...['fog', 'jazz', 'hand', 'cut', 'draw', 'treasure', 'dismantle'],
];

// Jev checks this many definitions per request.
const batchSize = 10;
const flagFrom = 0.65;

const jev = new TypeSafeClient({
  apiKey: process.env.TYPESAFEAI_API_KEY,
  timeout: 30_000,
  retry: { maxRetries: 2 },
});
const checks = (i: number) => ({
  [`added${i}`]: noul(
    `Does \`items[${i}].rewrite\` say anything about the meaning that \`items[${i}].source\` and its \`labels\` don't: a meaning, a fact, a restriction, or an example? Rewording, merging or reordering synonyms, leaving out wording, and putting what the sense applies to or is used with in parentheses at the start don't count.`,
  ),
  [`changed${i}`]: noul(
    `Does \`items[${i}].rewrite\` change the meaning of \`items[${i}].source\`: make it narrower, broader, or different?`,
  ),
});

type Result = {
  word: string;
  source: string;
  labels: string[];
  rewrite: string;
  issues: string[];
  added: number;
  changed: number;
};

// Oxford's definition format: a lowercase phrase, no final period, a verb
// without "to", labels shown separately rather than in the text.
function formatIssues(rewrite: string, partOfSpeech: string, shown: string[]) {
  return [
    !rewrite && 'empty',
    /^[A-Z]/.test(rewrite) &&
      !/^[A-Z][a-z]*[A-Z]|^(I|[A-Z][a-z]+ [A-Z])/.test(rewrite) &&
      'capitalized',
    /[^.]\.$/.test(rewrite) &&
      !/\b(etc|e\.g|i\.e)\.$/.test(rewrite) &&
      'final period',
    partOfSpeech === 'verb' && /^to\s/i.test(rewrite) && 'to-infinitive',
    shown.some((label) => rewrite.toLowerCase().startsWith(`(${label}`)) &&
      'repeats label',
  ].filter((issue): issue is string => Boolean(issue));
}

async function evaluate(word: string): Promise<Result[]> {
  const [row] = await drizzleDb
    .select()
    .from(articles)
    .where(and(eq(articles.headword, word), eq(articles.variety, 'en-US')))
    .limit(1);
  if (!row) throw new Error(`${word} not found`);
  const article = fromStoredArticle(row);
  const edited = await editArticle(article, () => {});

  // Source senses by the ids the editor gives them: `<lexeme>:<path>`.
  const sources = new Map<string, { sense: Sense; partOfSpeech: string }>();
  const visit = (senses: Sense[], prefix: string, partOfSpeech: string) =>
    senses.forEach((sense, i) => {
      sources.set(`${prefix}${i + 1}`, { sense, partOfSpeech });
      visit(sense.subsenses, `${prefix}${i + 1}.`, partOfSpeech);
    });
  article.etymons
    .flatMap((etymon) => etymon.lexemes)
    .forEach((lexeme, l) =>
      visit(lexeme.senses, `${l + 1}:`, lexeme.lexicalCategory),
    );

  const flat = (senses: EditedSense[]): EditedSense[] =>
    senses.flatMap((sense) => [sense, ...flat(sense.subsenses)]);
  const pairs = edited.etymons
    .flatMap((etymon) => etymon.lexemes)
    .flatMap((lexeme) => flat(lexeme.senses))
    .flatMap((sense) => {
      const source = sources.get(sense.id);
      return source
        ? [
            {
              rewrite: sense.definition,
              source: source.sense,
              partOfSpeech: source.partOfSpeech,
            },
          ]
        : [];
    });

  const results: Result[] = [];
  for (let start = 0; start < pairs.length; start += batchSize) {
    const batch = pairs.slice(start, start + batchSize);
    const items = batch.map(({ rewrite, source, partOfSpeech }) => ({
      partOfSpeech,
      source: source.definition,
      labels: source.labels,
      rewrite,
    }));
    const { answers } = (await jev.systemOne({
      state: { word, items },
      questions: Object.assign({}, ...items.map((_, i) => checks(i))),
    })) as { answers: Record<string, { noul: number }> };
    items.forEach((item, i) => {
      const { shown } = sortLabels(item.labels);
      results.push({
        word,
        source: item.source,
        labels: item.labels,
        rewrite: item.rewrite,
        issues: formatIssues(item.rewrite, item.partOfSpeech, shown),
        added: answers[`added${i}`].noul,
        changed: answers[`changed${i}`].noul,
      });
    });
  }
  return results;
}

const words = process.argv.length > 2 ? process.argv.slice(2) : testWords;
const results: Result[] = [];
// A few words at a time: each edit already makes many requests.
for (let i = 0; i < words.length; i += 4) {
  const batch = await Promise.all(words.slice(i, i + 4).map(evaluate));
  results.push(...batch.flat());
  process.stdout.write(`${Math.min(i + 4, words.length)}/${words.length} `);
}
console.log();

const added = results.filter((r) => r.added >= flagFrom);
const changed = results.filter((r) => r.changed >= flagFrom);
const formatted = results.filter((r) => r.issues.length > 0);
for (const r of [...new Set([...added, ...changed, ...formatted])]) {
  const flags = [
    r.added >= flagFrom && `adds (${r.added.toFixed(2)})`,
    r.changed >= flagFrom && `changes (${r.changed.toFixed(2)})`,
    ...r.issues,
  ].filter(Boolean);
  console.log(
    `${r.word}: ${flags.join(', ')}\n  source:  ${r.labels.length > 0 ? `(${r.labels.join(', ')}) ` : ''}${r.source}\n  rewrite: ${r.rewrite}\n`,
  );
}
const percent = (n: number) => `${((n / results.length) * 100).toFixed(1)}%`;
console.log(
  `${results.length} definitions | adds ${added.length} (${percent(added.length)}), changes ${changed.length} (${percent(changed.length)}), format ${formatted.length} (${percent(formatted.length)})`,
);
if (process.env.OUT) {
  writeFileSync(process.env.OUT, JSON.stringify(results, null, 2));
}
process.exit(0);
