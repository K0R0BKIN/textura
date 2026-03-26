import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { and, eq } from 'drizzle-orm';
import { QueryValidationSchema, type Variety } from './schemas';
import { drizzleDb } from './db';
import { articles } from './db/schema';

const client = new OpenAI();

export async function validateQuery(query: string, variety: Variety) {
  'use cache';

  if (!/[\p{L}\p{N}]/u.test(query)) return { valid: false };

  const existing = await drizzleDb
    .select({ headword: articles.headword })
    .from(articles)
    .where(and(eq(articles.headword, query), eq(articles.variety, variety)))
    .limit(1);

  if (existing.length > 0) return { valid: true };

  const response = await client.responses.parse({
    model: 'gpt-5.4-mini',
    prompt: {
      id: 'pmpt_69bd228450dc8195a8bf374707050ae00df4bc468296a4e2',
      variables: { query, variety },
    },
    reasoning: { effort: 'medium' },
    text: {
      format: zodTextFormat(QueryValidationSchema, 'query_validation'),
    },
  });

  return response.output_parsed ?? { valid: false };
}
