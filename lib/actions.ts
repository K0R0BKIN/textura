'use server';

import { updateTag } from 'next/cache';
import { drizzleDb } from './db';
import { articles } from './db/schema';

export async function revalidateArticles() {
  await drizzleDb.delete(articles);
  updateTag('articles');
}
