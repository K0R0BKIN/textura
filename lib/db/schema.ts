import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { Article } from '@/lib/schemas';

export const articles = pgTable('articles', {
  headword: text('headword').primaryKey(),
  data: jsonb('data').$type<Article>().notNull(),
  promptVersion: integer('prompt_version').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
