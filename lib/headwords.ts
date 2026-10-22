import 'server-only';

import OpenAI from 'openai';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';
import { cacheLife } from 'next/cache';
import { findArticle } from './articles';
import { buildCheckHeadwordSupportPrompt } from './prompts/check-headword-support';
import {
  HeadwordSchema,
  HeadwordSupportSchema,
  type Headword,
} from './schemas';

const client = new OpenAI();

async function checkHeadwordSupport(headword: Headword) {
  'use cache';
  cacheLife('max');

  if (await findArticle(headword)) return true;

  const response = await client.responses.parse({
    model: 'gpt-6-luna',
    input: buildCheckHeadwordSupportPrompt(headword),
    reasoning: { effort: 'low' },
    text: {
      format: zodTextFormat(HeadwordSupportSchema, 'headword_support'),
    },
  });

  return response.output_parsed?.valid === true;
}

export const SupportedHeadwordSchema = HeadwordSchema.refine(
  checkHeadwordSupport,
  {
    when(payload) {
      return HeadwordSchema.safeParse(payload.value).success;
    },
  },
).brand<'SupportedHeadword'>();

export type SupportedHeadword = z.infer<typeof SupportedHeadwordSchema>;
