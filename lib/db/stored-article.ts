import { z } from 'zod';
import {
  ArticleSchema,
  type Article,
  type Sense,
  type SenseSchema,
  type Variety,
} from '@/lib/schemas';

// Articles are stored compactly to fit the database's storage limit:
// headword and variety live in their own columns, and empty arrays are left
// out. ArticleSchema restores both on read.
export const StoredArticleSchema = ArticleSchema.omit({
  headword: true,
  variety: true,
});
export type StoredArticle = z.input<typeof StoredArticleSchema>;
type StoredSense = z.input<typeof SenseSchema>;

function toStoredSense({
  definition,
  examples,
  subsenses,
}: Sense): StoredSense {
  return {
    definition,
    ...(examples.length > 0 && { examples }),
    ...(subsenses.length > 0 && { subsenses: subsenses.map(toStoredSense) }),
  };
}

export function toStoredArticle({ etymons }: Article): StoredArticle {
  return {
    etymons: etymons.map(({ origin, lexemes }) => ({
      origin,
      lexemes: lexemes.map((lexeme) => ({
        ...lexeme,
        senses: lexeme.senses.map(toStoredSense),
      })),
    })),
  };
}

export function fromStoredArticle(row: {
  headword: string;
  variety: Variety;
  data: StoredArticle;
}): Article {
  return ArticleSchema.parse({
    headword: row.headword,
    variety: row.variety,
    ...row.data,
  });
}
