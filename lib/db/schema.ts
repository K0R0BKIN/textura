import {
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { Article, Variety } from '@/lib/schemas';

export const articles = pgTable(
  'articles',
  {
    headword: text('headword').notNull(),
    variety: text('variety').$type<Variety>().notNull().default('en-US'),
    data: jsonb('data').$type<Article>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.headword, t.variety] })],
);
