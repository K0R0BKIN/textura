// Counts Wiktionary's senses for the origin test words, to compare with
// Oxford's entries. Run with:
//   node --env-file=.env.local --conditions=react-server --import tsx \
//     scripts/count-senses.mts
import { and, eq } from 'drizzle-orm';
import { drizzleDb } from '../lib/db';
import { articles } from '../lib/db/schema';
import { fromStoredArticle } from '../lib/db/stored-article';

const words =
  'take set head light ring word go run cool line play bank check nice sky awful girl algebra coffee ketchup tea shampoo pajamas chocolate zero sandwich quark laser google fog jazz'.split(
    ' ',
  );

type Sense = { subsenses?: Sense[] };
const count = (senses: Sense[]): number =>
  senses.reduce((sum, s) => sum + 1 + count(s.subsenses ?? []), 0);

for (const word of words) {
  const [row] = await drizzleDb
    .select()
    .from(articles)
    .where(and(eq(articles.headword, word), eq(articles.variety, 'en-US')))
    .limit(1);
  if (!row) {
    console.log(word, 'missing');
    continue;
  }
  const article = fromStoredArticle(row);
  const lexemes = article.etymons.flatMap((e) => e.lexemes);
  const top = lexemes.reduce((sum, l) => sum + l.senses.length, 0);
  const all = lexemes.reduce((sum, l) => sum + count(l.senses), 0);
  console.log(
    `${word.padEnd(10)} etymologies=${article.etymons.length} top=${top} all=${all}`,
  );
}
process.exit(0);
