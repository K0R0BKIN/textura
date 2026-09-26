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
  headword: z.string(),
  variety: VarietySchema,
  url: z.string(),
  display: HeadwordDisplaySchema,
});
export type HeadwordRecord = z.infer<typeof HeadwordRecordSchema>;

// Normalized on the client too, so equivalent queries share one CDN cache entry.
export function normalizeSearchQuery(query: string) {
  return query.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 50);
}

export function isSearchableQuery(query: string) {
  return /[\p{L}\p{N}]/u.test(query);
}
