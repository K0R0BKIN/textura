import { sql } from 'drizzle-orm';
import {
  index,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { EditedArticle, Variety } from '@/lib/schemas';
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

// Articles edited into Textura's style, generated on first view.
export const editedArticles = pgTable(
  'edited_articles',
  {
    headword: text('headword').notNull(),
    variety: text('variety').$type<Variety>().notNull().default('en-US'),
    data: json('data').$type<EditedArticle>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.headword, t.variety] })],
);

// Phrases and phrasal verbs containing a word, such as "keep one's cool" and
// "cool down" for "cool", each also an article of its own. Built on import.
export const phrases = pgTable(
  'phrases',
  {
    headword: text('headword').notNull(),
    variety: text('variety').$type<Variety>().notNull().default('en-US'),
    phrase: text('phrase').notNull(),
    kind: text('kind').$type<'phrase' | 'phrasal verb'>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.headword, t.variety, t.phrase] })],
);
