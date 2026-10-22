import { z } from 'zod';
import { HomographSchema } from './homograph';
import { VarietySchema } from './variety';

export const ArticleSchema = z.object({
  headword: z.string(),
  variety: VarietySchema,
  homographs: z.array(HomographSchema),
});
export type Article = z.infer<typeof ArticleSchema>;
