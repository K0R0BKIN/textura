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
          pronunciation: z
            .string()
            .describe('IPA transcription without slashes'),
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

const prompt = `Generate a dictionary article for the given word.

Definitions should lead with what's most recognizable about the meaning, then add substance. Use clear, direct language at CEFR B2 level. Do not address the reader.

Group lexemes by etymological origin. Cover common senses without being exhaustive. Order etymon groups and senses from most common to most specialized. Use IPA for pronunciation.`;

export async function generateArticle(headword: string) {
  'use cache';

  const { output } = await generateText({
    model: openai('gpt-4o'),
    output: Output.object({ schema: articleSchema }),
    system: prompt,
    prompt: headword,
  });

  return output;
}
