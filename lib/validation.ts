import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { and, eq } from 'drizzle-orm';
import { TriageResultSchema, type Variety } from './schemas';
import { drizzleDb } from './db';
import { articles } from './db/schema';

const client = new OpenAI();

export async function validateHeadword(query: string, variety: Variety) {
  'use cache';

  const existing = await drizzleDb
    .select({ headword: articles.headword })
    .from(articles)
    .where(and(eq(articles.headword, query), eq(articles.variety, variety)))
    .limit(1);

  if (existing.length > 0) return true;

  const response = await client.responses.parse({
    model: 'gpt-5.4-mini',
    prompt: {
      id: 'pmpt_69bd228450dc8195a8bf374707050ae00df4bc468296a4e2',
      variables: { query, variety },
    },
    reasoning: { effort: 'medium' },
    text: {
      format: zodTextFormat(TriageResultSchema, 'triage_result'),
    },
  });

  return response.output_parsed?.valid ?? false;
}
