import { z } from 'zod';
import { EtymonSchema } from './etymon';
import { VarietySchema } from './variety';

export const ArticleSchema = z.object({
  headword: z.string(),
  variety: VarietySchema,
  etymons: z.array(EtymonSchema),
});
export type Article = z.infer<typeof ArticleSchema>;
