import { z } from 'zod';
import { EtymonSchema } from './etymon';

export const ArticleSchema = z.object({
  headword: z.string(),
  etymons: z
    .array(EtymonSchema)
    .describe(
      'A group of lexemes sharing the same historical origin. Unrelated words that happen to share a spelling get separate etymons.',
    ),
});
export type Article = z.infer<typeof ArticleSchema>;
