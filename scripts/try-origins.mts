// Rewrites only the origins of a few words with the current prompt, without
// saving: one request per word, retried when it stalls.
import { readFileSync } from 'node:fs';
import { and, eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { drizzleDb } from '../lib/db';
import { articles } from '../lib/db/schema';
import { fromStoredArticle } from '../lib/db/stored-article';

// EFFORT sets the reasoning effort, `none` by default.
const effort = (process.env.EFFORT ?? 'none') as 'none' | 'low';
const openai = new OpenAI({ timeout: 15_000, maxRetries: 3 });
const prompt = readFileSync('prompts/edit-origin.md', 'utf8');
const Output = z.object({
  items: z.array(z.object({ id: z.string(), text: z.string() })),
});

await Promise.all(
  process.argv.slice(2).map(async (word) => {
    const [row] = await drizzleDb
      .select()
      .from(articles)
      .where(and(eq(articles.headword, word), eq(articles.variety, 'en-US')))
      .limit(1);
    const items = fromStoredArticle(row!).etymons.flatMap((etymon, e) =>
      etymon.origin
        ? [{ id: `o${e + 1}`, kind: 'origin', text: etymon.origin }]
        : [],
    );
    const started = Date.now();
    const response = await openai.responses.parse({
      model: 'gpt-6-luna',
      instructions: prompt,
      input: JSON.stringify({ headword: word, items }),
      reasoning: { effort: effort },
      text: { format: zodTextFormat(Output, 'article') },
    });
    const lines = response.output_parsed!.items.map((item, i) => {
      const before = items[i].text.length;
      return `  [${before} → ${item.text.length}] ${item.text}`;
    });
    console.log(
      `${word} (${((Date.now() - started) / 1000).toFixed(1)} s)\n${lines.join('\n')}\n`,
    );
  }),
);
process.exit(0);
