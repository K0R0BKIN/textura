import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { cacheLife, cacheTag } from 'next/cache';
import { ArticleSchema } from './schemas';
import { systemPrompt } from './ai/prompts';

export async function generateArticle(headword: string) {
  'use cache';
  cacheLife('max');
  cacheTag('articles');

  const { output } = await generateText({
    model: openai('gpt-5.2'),
    output: Output.object({ schema: ArticleSchema }),
    temperature: 0,
    system: systemPrompt,
    prompt: `Generate a dictionary article for: ${headword}`,
  });

  return output;
}
