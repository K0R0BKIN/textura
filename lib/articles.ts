import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import {
  EditedArticleSchema,
  type EditedArticle,
  type Headword,
} from './schemas';
import { drizzleDb } from './db';
import { articles, editedArticles, phrases } from './db/schema';
import { fromStoredArticle } from './db/stored-article';

export async function findArticle(headword: Headword) {
  'use cache';
  cacheLife('max');
  cacheTag('articles');

  const [existing] = await drizzleDb
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.headword, headword.form),
        eq(articles.variety, headword.variety),
      ),
    )
    .limit(1);

  return existing ? fromStoredArticle(existing) : null;
}

// Not cached here: an article is missing until its first edit is saved. The
// route's CDN cache covers repeat reads.
export async function findEditedArticle(headword: Headword) {
  const [existing] = await drizzleDb
    .select()
    .from(editedArticles)
    .where(
      and(
        eq(editedArticles.headword, headword.form),
        eq(editedArticles.variety, headword.variety),
      ),
    )
    .limit(1);

  return existing ? EditedArticleSchema.parse(existing.data) : null;
}

export async function saveEditedArticle(article: EditedArticle) {
  await drizzleDb
    .insert(editedArticles)
    .values({
      headword: article.headword,
      variety: article.variety,
      data: article,
    })
    // Replaces an earlier edit, when articles are regenerated for testing.
    .onConflictDoUpdate({
      target: [editedArticles.headword, editedArticles.variety],
      set: { data: article, createdAt: new Date() },
    });
}

// Phrases and phrasal verbs containing the headword, alphabetically.
export async function findPhrases(headword: Headword) {
  'use cache';
  cacheLife('max');
  cacheTag('articles');

  return drizzleDb
    .select({ phrase: phrases.phrase, kind: phrases.kind })
    .from(phrases)
    .where(
      and(
        eq(phrases.headword, headword.form),
        eq(phrases.variety, headword.variety),
      ),
    )
    .orderBy(phrases.phrase);
}
