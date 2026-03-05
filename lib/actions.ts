'use server';

import { updateTag } from 'next/cache';

export async function revalidateArticles() {
  updateTag('articles');
}
