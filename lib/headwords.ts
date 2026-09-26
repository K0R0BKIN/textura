import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import { drizzleDb } from './db';
import { articles } from './db/schema';
import { slugToVariety } from './schemas';
import { HeadwordDisplaySchema, type HeadwordRecord } from './search/headwords';

const limit = 5;

// Prefix match on the lowercased headword, in index order so the scan stops
// after the first matches instead of reading every one (tens of thousands for
// a single letter). The index uses text_pattern_ops, so ordering must use its
// ~<~ operator to match. An exact match still leads, since it sorts before its
// extensions. Display fields are read only for the top matches, since each
// read parses the stored JSON.
export async function searchHeadwords(
  query: string,
): Promise<HeadwordRecord[]> {
  const pattern = `${query.replace(/[\\%_]/g, '\\$&')}%`;

  const top = drizzleDb
    .select({ headword: articles.headword, variety: articles.variety })
    .from(articles)
    .where(sql`lower(${articles.headword}) like ${pattern}`)
    .orderBy(sql`lower(${articles.headword}) using ~<~`)
    .limit(limit)
    .as('top');

  const rows = await drizzleDb
    .select({
      headword: top.headword,
      variety: top.variety,
      partOfSpeech: sql<
        string | null
      >`${articles.data} #>> '{etymons,0,lexemes,0,lexicalCategory}'`,
      pronunciation: sql<
        string | null
      >`${articles.data} #>> '{etymons,0,lexemes,0,transcription}'`,
      meaning: sql<
        string | null
      >`${articles.data} #>> '{etymons,0,lexemes,0,senses,0,definition}'`,
    })
    .from(top)
    .innerJoin(
      articles,
      and(
        eq(articles.headword, top.headword),
        eq(articles.variety, top.variety),
      ),
    )
    .orderBy(sql`lower(${top.headword}) using ~<~`);

  return rows.map((row) => ({
    headword: row.headword,
    variety: row.variety,
    url: `/dictionary/${slugToVariety.encode(row.variety)}/${encodeURIComponent(row.headword)}`,
    display: HeadwordDisplaySchema.parse({
      partOfSpeech: row.partOfSpeech ?? undefined,
      pronunciation: row.pronunciation ?? undefined,
      meaning: row.meaning ?? undefined,
    }),
  }));
}
