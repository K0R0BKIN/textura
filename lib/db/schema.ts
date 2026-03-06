import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { Article } from '@/lib/schemas';

export const articles = pgTable('articles', {
  headword: text('headword').primaryKey(),
  data: jsonb('data').$type<Article>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
