import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { cacheLife, cacheTag } from 'next/cache';
import { eq } from 'drizzle-orm';
import { ArticleSchema } from './schemas';
import { systemPrompt } from './ai/prompts';
import { drizzleDb } from './db';
import { articles } from './db/schema';

export async function generateArticle(headword: string) {
  'use cache';
  cacheLife('max');
  cacheTag('articles');

  const existing = await drizzleDb
    .select()
    .from(articles)
    .where(eq(articles.headword, headword))
    .limit(1);

  if (existing[0]) return existing[0].data;

  const { output } = await generateText({
    model: openai('gpt-5.4'),
    output: Output.object({ schema: ArticleSchema }),
    providerOptions: {
      openai: { reasoningEffort: 'low' },
    },
    system: systemPrompt,
    prompt: `Generate a dictionary article for: ${headword}`,
  });

  if (output) {
    await drizzleDb
      .insert(articles)
      .values({ headword, data: output })
      .onConflictDoNothing();
  }

  return output;
}
