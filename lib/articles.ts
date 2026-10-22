import 'server-only';

import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { cacheLife, cacheTag } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { ArticleSchema, type Headword } from './schemas';
import { drizzleDb } from './db';
import { articles } from './db/schema';
import { articleToHeadwordRecord } from './algolia/headwords';
import { writeClient } from './algolia/write-client';
import { buildGenerateArticlePrompt } from './prompts/generate-article';

const client = new OpenAI();

export async function findArticle(headword: Headword) {
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

export async function generateArticle(headword: Headword) {
  'use cache';
  cacheLife('max');
  cacheTag('articles');

  const response = await client.responses.parse({
    model: 'gpt-6-luna',
    input: buildGenerateArticlePrompt(headword),
    reasoning: { effort: 'low' },
    text: {
      format: zodTextFormat(ArticleSchema, 'article'),
    },
  });

  const output = response.output_parsed;

  if (output) {
    await drizzleDb
      .insert(articles)
      .values({
        headword: headword.form,
        variety: headword.variety,
        data: output,
      })
      .onConflictDoNothing();

    await writeClient
      .saveObject({
        indexName: 'headwords',
        body: articleToHeadwordRecord(output),
      })
      .catch((error) => console.error('Failed to index headword', error));
  }

  return output;
}
