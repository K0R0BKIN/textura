import { z } from 'zod';
import { EtymonSchema } from './etymon';

export const ArticleSchema = z.object({
  headword: z.string(),
  etymons: z.array(EtymonSchema),
});
export type Article = z.infer<typeof ArticleSchema>;
