import { z } from 'zod';
import { LexicalCategorySchema, TranscriptionSchema } from './etymon';
import { VarietySchema } from './variety';

// An article after editing: senses in display order, grouped into core senses
// and subsenses, with Textura's rewritten text.
export const EditedSenseSchema = z.object({
  id: z.string(),
  // Wiktionary's labels, shown before the definition, such as "informal".
  labels: z.array(z.string()).default([]),
  definition: z.string(),
  examples: z.array(z.string()),
  get subsenses(): z.ZodArray<typeof EditedSenseSchema> {
    return z.array(EditedSenseSchema);
  },
});
export type EditedSense = z.infer<typeof EditedSenseSchema>;

export const EditedLexemeSchema = z.object({
  lexicalCategory: LexicalCategorySchema,
  transcription: TranscriptionSchema.optional(),
  senses: z.array(EditedSenseSchema),
});
export type EditedLexeme = z.infer<typeof EditedLexemeSchema>;

export const EditedEtymonSchema = z.object({
  // Set when the etymon has an origin; `origin` holds its text.
  originId: z.string().optional(),
  origin: z.string().optional(),
  lexemes: z.array(EditedLexemeSchema),
});
export type EditedEtymon = z.infer<typeof EditedEtymonSchema>;

export const EditedArticleSchema = z.object({
  headword: z.string(),
  variety: VarietySchema,
  etymons: z.array(EditedEtymonSchema),
  // Phrases and phrasal verbs containing the headword, each an article of
  // its own, listed at the end.
  phrases: z
    .array(
      z.object({
        phrase: z.string(),
        kind: z.enum(['phrase', 'phrasal verb']),
      }),
    )
    .default([]),
});
export type EditedArticle = z.infer<typeof EditedArticleSchema>;

// Messages of a streamed edit, one JSON object per line. `outline` carries
// the article with empty text and the order in which item text arrives; in a
// part of speech that's being grouped, the senses are in Wiktionary's order
// until `core` messages replace them, one core sense at a time, each before
// its text. `text` appends to an item; `end` marks an item's text as final.
export type EditStreamMessage =
  | { type: 'outline'; article: EditedArticle; order: string[] }
  | { type: 'core'; etymon: number; lexeme: number; sense: EditedSense }
  | { type: 'text'; id: string; text: string }
  | { type: 'end'; id: string }
  | { type: 'done' }
  | { type: 'error'; message: string };
