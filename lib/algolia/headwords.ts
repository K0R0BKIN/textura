import { z } from 'zod';

import {
  LexicalCategorySchema,
  TranscriptionSchema,
  VarietySchema,
} from '@/lib/schemas';

export const HeadwordDisplaySchema = z.object({
  partOfSpeech: LexicalCategorySchema.optional(),
  pronunciation: TranscriptionSchema.optional(),
  meaning: z.string().optional(),
});
export type HeadwordDisplay = z.infer<typeof HeadwordDisplaySchema>;

export const HeadwordRecordSchema = z.object({
  objectID: z.string(),
  headword: z.string(),
  variety: VarietySchema,
  url: z.string(),
  hasArticle: z.boolean(),
  display: HeadwordDisplaySchema,
});
export type HeadwordRecord = z.infer<typeof HeadwordRecordSchema>;
