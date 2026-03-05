import { z } from 'zod';

export const SenseSchema = z.object({
  definition: z.string(),
  example: z.string(),
});
export type Sense = z.infer<typeof SenseSchema>;

export const VarietySchema = z.enum(['American English']);
export type Variety = z.infer<typeof VarietySchema>;

export const LexicalCategorySchema = z.enum([
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'pronoun',
  'determiner',
  'interjection',
]);
export type LexicalCategory = z.infer<typeof LexicalCategorySchema>;

export const LexemeSchema = z.object({
  lexicalCategory: LexicalCategorySchema,
  variety: VarietySchema,
  pronunciation: z.string().describe('IPA transcription without slashes'),
  senses: z.array(SenseSchema),
});
export type Lexeme = z.infer<typeof LexemeSchema>;

export const EtymonSchema = z.object({
  origin: z.string().describe('Brief prose etymology.'),
  lexemes: z.array(LexemeSchema),
});
export type Etymon = z.infer<typeof EtymonSchema>;
