import { z } from 'zod';

// Empty arrays are left out of stored articles and restored here on parse.
export const SenseSchema = z.object({
  definition: z.string(),
  examples: z.array(z.string()).default([]),
  get subsenses(): z.ZodDefault<z.ZodArray<typeof SenseSchema>> {
    return z.array(SenseSchema).default([]);
  },
});
export type Sense = z.infer<typeof SenseSchema>;

export const LexicalCategorySchema = z.enum([
  'noun',
  'proper noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'pronoun',
  'determiner',
  'numeral',
  'interjection',
  'particle',
  'phrase',
  'abbreviation',
  'contraction',
  'prefix',
  'suffix',
]);
export type LexicalCategory = z.infer<typeof LexicalCategorySchema>;

export const TranscriptionSchema = z
  .string()
  .describe('IPA transcription without slashes');
export type Transcription = z.infer<typeof TranscriptionSchema>;

export const LexemeSchema = z.object({
  lexicalCategory: LexicalCategorySchema,
  transcription: TranscriptionSchema.optional(),
  senses: z.array(SenseSchema),
});
export type Lexeme = z.infer<typeof LexemeSchema>;

export const EtymonSchema = z.object({
  origin: z.string().optional(),
  lexemes: z.array(LexemeSchema),
});
export type Etymon = z.infer<typeof EtymonSchema>;
