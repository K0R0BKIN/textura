import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { cacheLife } from 'next/cache';
import { ArticleSchema } from './schemas';

const prompt = `Generate a dictionary article.`;

export async function generateArticle(headword: string) {
  'use cache';
  cacheLife('max');

  const { output } = await generateText({
    model: openai('gpt-5-mini'),
    output: Output.object({ schema: ArticleSchema }),
    system: prompt,
    prompt: headword,
  });

  return output;
}
