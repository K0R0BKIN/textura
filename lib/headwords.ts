import 'server-only';

import { asc, sql } from 'drizzle-orm';
import { drizzleDb } from './db';
import { articles } from './db/schema';
import { slugToVariety } from './schemas';
import { HeadwordDisplaySchema, type HeadwordRecord } from './search/headwords';

const limit = 5;

// Prefix match on the lowercased headword, shortest first so an exact match
// always leads. Backed by articles_headword_prefix_idx.
export async function searchHeadwords(
  query: string,
): Promise<HeadwordRecord[]> {
  const pattern = `${query.replace(/[\\%_]/g, '\\$&')}%`;

  const rows = await drizzleDb
    .select({
      headword: articles.headword,
      variety: articles.variety,
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
    .from(articles)
    .where(sql`lower(${articles.headword}) like ${pattern}`)
    .orderBy(sql`length(${articles.headword})`, asc(articles.headword))
    .limit(limit);

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
