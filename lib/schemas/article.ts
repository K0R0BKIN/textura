import { z } from 'zod';
import { EtymonSchema } from './etymon';

export const VarietySchema = z.enum(['en-US']);
export type Variety = z.infer<typeof VarietySchema>;

export const ArticleSchema = z.object({
  headword: z.string(),
  variety: VarietySchema,
  etymons: z.array(EtymonSchema),
});
export type Article = z.infer<typeof ArticleSchema>;
