// Prints an edited article next to its Wiktionary source, to see what the
// edit leaves out: the saved edit, or with FRESH=1 a new one (not saved). Run
// with:
//   node --env-file=.env.local --conditions=react-server --import tsx \
//     scripts/compare-edit.mts word…
import { and, eq } from 'drizzle-orm';
import { drizzleDb } from '../lib/db';
import { articles, editedArticles } from '../lib/db/schema';
import { fromStoredArticle } from '../lib/db/stored-article';
import { editArticle } from '../lib/editing/edit-article';
import type { EditedSense, Sense } from '../lib/schemas';

for (const word of process.argv.slice(2)) {
  const where = (table: typeof articles | typeof editedArticles) =>
    and(eq(table.headword, word), eq(table.variety, 'en-US'));
  const [source] = await drizzleDb
    .select()
    .from(articles)
    .where(where(articles));
  if (!source) {
    console.log(`${word}: missing`);
    continue;
  }
  const article = fromStoredArticle(source);
  const [saved] = process.env.FRESH
    ? []
    : await drizzleDb
        .select()
        .from(editedArticles)
        .where(where(editedArticles));
  const edited = process.env.FRESH
    ? { data: await editArticle(article, () => {}) }
    : saved;
  if (!edited) {
    console.log(`${word}: not edited`);
    continue;
  }

  // Source senses by the ids the editor gives them: `<lexeme>:<path>`.
  const byId = new Map<string, Sense>();
  const visit = (senses: Sense[], prefix: string) =>
    senses.forEach((sense, i) => {
      byId.set(`${prefix}${i + 1}`, sense);
      visit(sense.subsenses, `${prefix}${i + 1}.`);
    });
  article.etymons
    .flatMap((etymon) => etymon.lexemes)
    .forEach((lexeme, l) => visit(lexeme.senses, `${l + 1}:`));

  console.log(`\n######## ${word}`);
  for (const [e, etymon] of edited.data.etymons.entries()) {
    console.log(`\nORIGIN source: ${article.etymons[e]?.origin ?? '—'}`);
    console.log(`ORIGIN ours:   ${etymon.origin ?? '—'}`);
    const print = (senses: EditedSense[], depth: number) => {
      for (const sense of senses) {
        const src = byId.get(sense.id);
        byId.delete(sense.id);
        console.log(`${'  '.repeat(depth)}- ${sense.definition}`);
        console.log(`${'  '.repeat(depth)}  ⟵ ${src?.definition}`);
        print(sense.subsenses, depth + 1);
      }
    };
    for (const lexeme of etymon.lexemes) {
      console.log(`\n[${lexeme.lexicalCategory}]`);
      print(lexeme.senses, 0);
    }
  }
  if (byId.size > 0) {
    console.log(
      `\nNOT SHOWN: ${[...byId.values()].map((s) => s.definition).join(' | ')}`,
    );
  }
}
process.exit(0);
