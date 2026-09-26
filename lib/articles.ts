import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import type { Headword } from './schemas';
import { drizzleDb } from './db';
import { articles } from './db/schema';

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

  return existing?.data ?? null;
}
