// Edits articles through the real pipeline without saving them, and reports
// when each milestone reaches the reader. Run with:
//   node --env-file=.env.local --conditions=react-server --import tsx \
//     scripts/time-articles.mts [word…]
import { and, eq } from 'drizzle-orm';
import { drizzleDb } from '../lib/db';
import { articles } from '../lib/db/schema';
import { fromStoredArticle } from '../lib/db/stored-article';
import { editArticle } from '../lib/editing/edit-article';
import type { EditedSense } from '../lib/schemas';

const words =
  process.argv.length > 2
    ? process.argv.slice(2)
    : ['check', 'run', 'play', 'line', 'ketchup', 'sky'];

const seconds = (ms?: number) =>
  ms === undefined ? '—' : `${(ms / 1000).toFixed(1)} s`;
const count = (senses: EditedSense[]): number =>
  senses.reduce((n, s) => n + 1 + count(s.subsenses), 0);

for (const word of words) {
  const [row] = await drizzleDb
    .select()
    .from(articles)
    .where(and(eq(articles.headword, word), eq(articles.variety, 'en-US')))
    .limit(1);
  if (!row) throw new Error(`${word} not found`);

  const started = Date.now();
  const at: Record<string, number> = {};
  let firstCore: number | undefined;
  let firstOrigin: number | undefined;
  let firstSense: number | undefined;
  const edited = await editArticle(fromStoredArticle(row), (message) => {
    const ms = Date.now() - started;
    if (message.type === 'outline') at.outline = ms;
    if (message.type === 'core') firstCore ??= ms;
    if (message.type === 'text') {
      if (message.id.startsWith('o')) firstOrigin ??= ms;
      else firstSense ??= ms;
    }
    if (message.type === 'done') at.done = ms;
  });

  const structure = edited.etymons
    .flatMap((etymon) => etymon.lexemes)
    .map(
      (lexeme) =>
        `${lexeme.lexicalCategory} ${lexeme.senses.length} cores/${count(lexeme.senses)}`,
    )
    .join(', ');
  console.log(
    `${word.padEnd(8)} outline ${seconds(at.outline)}, origin ${seconds(firstOrigin)}, first core ${seconds(firstCore)}, first sense ${seconds(firstSense)}, done ${seconds(at.done)} | ${structure}`,
  );
}
process.exit(0);
