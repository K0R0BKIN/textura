import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { cacheLife, cacheTag } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { ArticleSchema, type Variety } from './schemas';
import { drizzleDb } from './db';
import { articles } from './db/schema';

const client = new OpenAI();

export async function generateArticle(
  headword: string,
  variety: Variety = 'en-US',
) {
  'use cache';
  cacheLife('max');
  cacheTag('articles');

  const existing = await drizzleDb
    .select()
    .from(articles)
    .where(and(eq(articles.headword, headword), eq(articles.variety, variety)))
    .limit(1);

  if (existing[0]) return existing[0].data;

  const response = await client.responses.parse({
    model: 'gpt-5.4-mini',
    prompt: {
      id: 'pmpt_69a975f6d0b0819791769e9d5c95723a046b78f99e06fd36',
      variables: { headword, variety },
    },
    reasoning: { effort: 'medium' },
    text: {
      format: zodTextFormat(ArticleSchema, 'article'),
      verbosity: 'medium',
    },
  });

  const output = response.output_parsed;

  if (output) {
    await drizzleDb
      .insert(articles)
      .values({ headword, variety, data: output })
      .onConflictDoNothing();
  }

  return output;
}
