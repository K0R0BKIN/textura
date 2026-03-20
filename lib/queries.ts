import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { TriageResultSchema, type Variety } from './schemas';

const client = new OpenAI();

export async function triageQuery(query: string, variety: Variety) {
  const response = await client.responses.parse({
    model: 'gpt-5.4-mini',
    prompt: {
      id: 'pmpt_69bd228450dc8195a8bf374707050ae00df4bc468296a4e2',
      variables: { query, variety },
    },
    reasoning: { effort: 'low' },
    text: {
      format: zodTextFormat(TriageResultSchema, 'triage_result'),
    },
  });

  return response.output_parsed;
}
