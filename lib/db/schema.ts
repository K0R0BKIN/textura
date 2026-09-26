import { sql } from 'drizzle-orm';
import {
  index,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { Variety } from '@/lib/schemas';
import type { StoredArticle } from './stored-article';

export const articles = pgTable(
  'articles',
  {
    headword: text('headword').notNull(),
    variety: text('variety').$type<Variety>().notNull().default('en-US'),
    data: json('data').$type<StoredArticle>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.headword, t.variety] }),
    index('articles_headword_prefix_idx').on(
      sql`lower(${t.headword}) text_pattern_ops`,
    ),
  ],
);
