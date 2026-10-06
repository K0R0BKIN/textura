// Tests the Group step: can a model arrange a part of speech's senses into
// Oxford's core senses and subsenses, and how fast? Compares models and
// reasoning levels on a few big words. Run with:
//   node --env-file=.env.local --conditions=react-server --import tsx \
//     scripts/test-grouping.mts [word…]
// CONFIGS=luna:none,sol:low limits the configurations; OUT=file saves results.
import { writeFileSync } from 'node:fs';
import { and, eq } from 'drizzle-orm';
import { JSONParser } from '@streamparser/json';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { drizzleDb } from '../lib/db';
import { articles } from '../lib/db/schema';
import { fromStoredArticle } from '../lib/db/stored-article';
import type { Sense } from '../lib/schemas';

const openai = new OpenAI({ timeout: 120_000, maxRetries: 0 });

const prompt = `You arrange the senses of one part of speech of a dictionary word, taken from Wiktionary, the way the New Oxford American Dictionary does.

Oxford organizes each part of speech into a few core senses, each with subsenses under it. A core sense is the most literal, central meaning of the word in modern use: not necessarily the oldest, and not necessarily the most frequent, since figurative senses are sometimes more frequent. Each subsense belongs under the core sense it comes from: a figurative extension of it, a special case of it, or another shift that keeps part of its meaning. A sense that is unrelated to the others is a core sense of its own.

Order core senses from the most central in modern use to the least, and order each core's subsenses the same way. Rare, archaic, and technical senses go after common ones.

Each input sense has an \`id\` and its \`definition\`; some list \`subsenses\` of their own, which stay with them and need no placing. Use every id exactly once, either as a core sense or as a subsense. Don't write or change definitions.`;

const Output = z.object({
  cores: z.array(z.object({ id: z.string(), subsenses: z.array(z.string()) })),
});

const configs = (process.env.CONFIGS ?? 'luna:none,luna:low,sol:low,sol:medium')
  .split(',')
  .map((config) => {
    const [model, effort] = config.split(':');
    return {
      name: config,
      model: `gpt-6-${model}`,
      effort: effort as 'none' | 'low' | 'medium',
    };
  });

const words =
  process.argv.length > 2
    ? process.argv.slice(2)
    : ['run', 'set', 'take', 'check'];

type Input = { id: string; definition: string; subsenses?: string[] };

async function group(
  input: Input[],
  label: string,
  config: (typeof configs)[0],
) {
  const started = Date.now();
  // Streamed, as the pipeline would: the first complete core sense can be
  // defined while the rest are still being grouped.
  let firstText: number | undefined;
  let firstCore: number | undefined;
  const parser = new JSONParser({ paths: ['$.cores.*'] });
  parser.onValue = () => (firstCore ??= Date.now() - started);
  try {
    const stream = openai.responses.stream({
      model: config.model,
      reasoning: { effort: config.effort },
      instructions: prompt,
      input: JSON.stringify({ partOfSpeech: label, senses: input }),
      text: { format: zodTextFormat(Output, 'grouping') },
    });
    stream.on('response.output_text.delta', ({ delta }) => {
      firstText ??= Date.now() - started;
      if (!parser.isEnded) parser.write(delta);
    });
    const response = await stream.finalResponse();
    const { cores } = Output.parse(JSON.parse(response.output_text));
    const reasoningTokens =
      response.usage?.output_tokens_details.reasoning_tokens ?? 0;
    const placed = cores.flatMap((core) => [core.id, ...core.subsenses]);
    const ids = new Set(input.map((sense) => sense.id));
    const problems = [
      ...input
        .filter((s) => !placed.includes(s.id))
        .map((s) => `missing ${s.id}`),
      ...placed
        .filter((id, i) => placed.indexOf(id) !== i)
        .map((id) => `duplicate ${id}`),
      ...placed.filter((id) => !ids.has(id)).map((id) => `unknown ${id}`),
    ];
    return {
      ms: Date.now() - started,
      firstText,
      firstCore,
      reasoningTokens,
      cores,
      problems,
    };
  } catch (error) {
    return {
      ms: Date.now() - started,
      cores: [],
      problems: [`failed: ${error instanceof Error ? error.message : error}`],
    };
  }
}

const results: unknown[] = [];
for (const word of words) {
  const [row] = await drizzleDb
    .select()
    .from(articles)
    .where(and(eq(articles.headword, word), eq(articles.variety, 'en-US')))
    .limit(1);
  if (!row) throw new Error(`${word} not found`);
  const article = fromStoredArticle(row);
  // Oxford groups each etymology's part of speech separately; small ones
  // need no grouping.
  const lexemes = article.etymons.flatMap((etymon, e) =>
    etymon.lexemes
      .filter((lexeme) => lexeme.senses.length >= 6)
      .map((lexeme) => ({
        label: `${lexeme.lexicalCategory} (etymology ${e + 1})`,
        senses: lexeme.senses,
      })),
  );

  for (const config of configs) {
    // Parts of speech run in parallel, as they would in the pipeline.
    const started = Date.now();
    const groupings = await Promise.all(
      lexemes.map(async ({ label, senses }) => {
        const input: Input[] = senses.map((sense: Sense, i) => ({
          id: `s${i + 1}`,
          definition: sense.definition,
          ...(sense.subsenses.length > 0 && {
            subsenses: sense.subsenses.map((sub) => sub.definition),
          }),
        }));
        const result = await group(input, label, config);
        return { label, senses: input, ...result };
      }),
    );
    const total = Date.now() - started;
    console.log(
      `${word.padEnd(6)} ${config.name.padEnd(11)} ${(total / 1000).toFixed(1).padStart(5)} s | ` +
        groupings
          .map(
            (g) =>
              `${g.label.split(' ')[0]} ${g.senses.length}→${g.cores.length} first ${((g.firstCore ?? 0) / 1000).toFixed(1)}s/${(g.ms / 1000).toFixed(1)}s r${'reasoningTokens' in g ? g.reasoningTokens : 0}${g.problems.length > 0 ? ` (${g.problems.length} problems)` : ''}`,
          )
          .join(', '),
    );
    results.push({ word, config: config.name, total, groupings });
  }
}

if (process.env.OUT)
  writeFileSync(process.env.OUT, JSON.stringify(results, null, 2));
process.exit(0);
