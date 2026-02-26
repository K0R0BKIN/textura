import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const articleSchema = z.object({
  headword: z.string(),
  etymons: z.array(
    z.object({
      lexemes: z.array(
        z.object({
          lexicalCategory: z.enum(['noun', 'verb', 'adjective', 'adverb']),
          pronunciation: z.string(),
          senses: z.array(
            z.object({
              definition: z.string(),
            }),
          ),
        }),
      ),
    }),
  ),
});

export async function generateArticle(headword: string) {
  const { output } = await generateText({
    model: openai('gpt-4o'),
    output: Output.object({ schema: articleSchema }),
    prompt: `Define the English word "${headword}". Group lexemes by shared etymological origin.`,
  });

  return output;
}
