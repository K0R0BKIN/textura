import { z } from 'zod';

import {
  LexicalCategorySchema,
  TranscriptionSchema,
  VarietySchema,
  slugToVariety,
  type Headword,
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

function headwordObjectID(headword: Headword) {
  return `${headword.variety}:${encodeURIComponent(headword.form)}`;
}

export function toHeadwordRecord(
  headword: Headword,
  display: HeadwordDisplay,
): HeadwordRecord {
  return HeadwordRecordSchema.parse({
    objectID: headwordObjectID(headword),
    headword: headword.form,
    variety: headword.variety,
    url: `/dictionary/${slugToVariety.encode(headword.variety)}/${encodeURIComponent(headword.form)}`,
    hasArticle: true,
    display,
  });
}
