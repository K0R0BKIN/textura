import '@/envConfig';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { noul, score, TypeSafeClient } from '@typesafe-ai/sdk';
import { and, eq } from 'drizzle-orm';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { drizzleDb } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { fromStoredArticle } from '@/lib/db/stored-article';
import type { Article, Sense } from '@/lib/schemas';

// Pilot for on-demand article editing. Reads articles from the database
// (read-only), ranks senses with Jev, rewrites them with an OpenAI model, and
// writes a Markdown report. Nothing is stored.
//
// Usage:
//   pnpm tsx scripts/pilot-edit.ts --out report.md [--model gpt-6-luna]
//     [--effort none] bank google nice

const prices = {
  jevInput: 0.042,
  'gpt-6-luna': { input: 0.1, cachedInput: 0.01, output: 0.5 },
  'gpt-6-sol': { input: 2, cachedInput: 0.2, output: 10 },
} as const;

// Which senses are shown up front; the rest go behind "show more". An article
// always shows at least its top sense.
const showRules = {
  score: (s: RankedSense) => s.commonness >= 2,
  learner: (s: RankedSense) => s.learner >= 0.5,
};

// Groups (a top-level sense with its subsenses) are packed into chunks of
// about this many output tokens, each rewritten by a parallel request.
const chunkTokens = 300;

const commonness = score(
  'How commonly is `word` used with the meaning in `sense.definition` in present-day English?',
  [
    'Obsolete or archaic: found only in older texts',
    'Rare, regional, or confined to a narrow technical or specialist field',
    'Occasional: understood by many speakers but not used day to day',
    'Common: regularly used in everyday speech or writing',
    'Core: among the first meanings most speakers think of for this word',
  ],
);

const learner = noul(
  'Would a general dictionary for learners of English include this meaning of `word`, as given in `sense.definition`?',
  {
    true: 'Yes: learners are likely to meet this meaning in everyday reading, conversation, or media, so a learner’s dictionary lists it.',
    false:
      'No: only a comprehensive, historical, or specialist dictionary would list this meaning; learners rarely need it.',
  },
);

const EditedSensesSchema = z.object({
  senses: z.array(
    z.object({
      id: z.string(),
      definition: z.string(),
      example: z.string().nullable(),
    }),
  ),
});

const EditedOriginSchema = z.object({ origin: z.string() });

type RankedSense = {
  id: string;
  source: Sense;
  commonness: number;
  learner: number;
  subsenses: RankedSense[];
};

function flatten(senses: RankedSense[]): RankedSense[] {
  return senses.flatMap((sense) => [sense, ...flatten(sense.subsenses)]);
}

function withIds(senses: Sense[], prefix = ''): RankedSense[] {
  return senses.map((source, index) => {
    const id = `${prefix}${index + 1}`;
    return {
      id,
      source,
      commonness: 0,
      learner: 0,
      subsenses: withIds(source.subsenses, `${id}.`),
    };
  });
}

function parentId(id: string) {
  return id.split('.').slice(0, -1).join('.');
}

// Rough output size of one sense: its rewritten definition, an example, JSON.
function estimateTokens(sense: RankedSense) {
  return sense.source.definition.length / 4 + 30;
}

// Splits senses into units that fit a chunk: a sense together with all its
// subsenses when they fit, otherwise the sense alone followed by its
// subsenses' units. Splitting large groups keeps one group from becoming the
// slowest request.
function units(senses: RankedSense[]): RankedSense[][] {
  return senses.flatMap((sense) => {
    const group = flatten([sense]);
    const size = group.reduce((n, s) => n + estimateTokens(s), 0);
    return size <= chunkTokens ? [group] : [[sense], ...units(sense.subsenses)];
  });
}

// Packs consecutive units into chunks of about chunkTokens output tokens.
function chunkSenses(senses: RankedSense[]): RankedSense[][] {
  const chunks: RankedSense[][] = [];
  let current: RankedSense[] = [];
  let size = 0;
  for (const unit of units(senses)) {
    const unitSize = unit.reduce((n, s) => n + estimateTokens(s), 0);
    if (current.length > 0 && size + unitSize > chunkTokens) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(...unit);
    size += unitSize;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

// Ancestors of a chunk's senses that another chunk rewrites. They're sent as
// read-only context so subsenses are written knowing their group.
function contextFor(chunk: RankedSense[], byId: Map<string, RankedSense>) {
  const ids = new Set(chunk.map((s) => s.id));
  const context = new Map<string, RankedSense>();
  for (const sense of chunk) {
    for (let id = parentId(sense.id); id; id = parentId(id)) {
      if (!ids.has(id)) context.set(id, byId.get(id)!);
    }
  }
  return [...context.values()].toSorted((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true }),
  );
}

// What's wrong with a chunk's output: senses missing, added or duplicated.
function chunkProblems(
  senses: RankedSense[],
  edited: z.infer<typeof EditedSensesSchema>['senses'],
) {
  const expected = senses.map((s) => s.id);
  const actual = edited.map((s) => s.id);
  const problems = [
    ...expected
      .filter((id) => !actual.includes(id))
      .map((id) => `${id} missing`),
    ...actual
      .filter((id, k) => !expected.includes(id) || actual.indexOf(id) !== k)
      .map((id) => `${id} unexpected`),
  ];
  return problems;
}

// A completed sense object in streamed JSON output.
const completedSense =
  /\{"id":"([^"]+)","definition":"(?:[^"\\]|\\.)*","example":(?:null|"(?:[^"\\]|\\.)*")\}/g;

// Senses shown up front for one ranked part of speech: a sense when it passes
// the rule, and its subsenses that pass too.
function* visibleSenses(
  senses: RankedSense[],
  shown: (sense: RankedSense) => boolean,
) {
  for (const sense of senses) {
    if (!shown(sense)) continue;
    yield sense;
    for (const subsense of flatten(sense.subsenses)) {
      if (shown(subsense)) yield subsense;
    }
  }
}

// Orders siblings by commonness (stable). A parent takes the highest values
// among its descendants, so a common subsense lifts its group.
function rank(senses: RankedSense[]): RankedSense[] {
  for (const sense of senses) {
    sense.subsenses = rank(sense.subsenses);
    sense.commonness = Math.max(
      sense.commonness,
      ...sense.subsenses.map((s) => s.commonness),
    );
    sense.learner = Math.max(
      sense.learner,
      ...sense.subsenses.map((s) => s.learner),
    );
  }
  return senses.toSorted((a, b) => b.commonness - a.commonness);
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: 'string', default: 'pilot-report.md' },
      model: { type: 'string', default: 'gpt-6-luna' },
      effort: { type: 'string', default: 'none' },
      show: { type: 'string', default: 'learner' },
    },
  });

  const model = values.model as keyof typeof prices & `gpt-${string}`;
  const effort = values.effort as OpenAI.ReasoningEffort;
  const showRule = values.show as keyof typeof showRules;
  const openai = new OpenAI();
  const jev = new TypeSafeClient({
    apiKey: process.env.TYPESAFEAI_API_KEY,
    // Jev is either fast or down, so fail fast rather than wait.
    timeout: 5_000,
    retry: { maxRetries: 1 },
  });
  const sensesPrompt = readFileSync('prompts/edit-senses.md', 'utf8');
  const originPrompt = readFileSync('prompts/edit-origin.md', 'utf8');

  const report: string[] = [
    `# Editing pilot`,
    ``,
    `Model: \`${model}\`, reasoning effort: \`${effort}\`, Jev: \`jev-latest\`, shown by: \`${showRule}\` rule`,
    ``,
  ];
  const summary: string[] = [
    `| Word | Senses | Shown (learner) | Shown (score) | Chunks | First sense | First 5 in order | All shown | Total | Cost |`,
    `|---|---|---|---|---|---|---|---|---|---|`,
  ];

  for (const word of positionals) {
    const [row] = await drizzleDb
      .select()
      .from(articles)
      .where(and(eq(articles.headword, word), eq(articles.variety, 'en-US')))
      .limit(1);
    if (!row) {
      console.warn(`No article for "${word}"`);
      continue;
    }
    const article: Article = fromStoredArticle(row);

    const lexemes = article.etymons.flatMap((etymon, e) =>
      etymon.lexemes.map((lexeme) => ({
        etymon: e,
        lexeme,
        senses: withIds(lexeme.senses),
      })),
    );

    const start = performance.now();
    const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

    // Jev: one small request per sense, all in parallel, alongside the edit.
    let jevMs = 0;
    let jevTokens = 0;
    const scoring = Promise.all(
      lexemes.flatMap(({ lexeme, senses }) =>
        flatten(senses).map(async (sense) => {
          const parent = sense.id.includes('.')
            ? flatten(senses).find((s) => s.id === parentId(sense.id))
            : undefined;
          const { answers, usage } = await jev.systemOne({
            state: {
              word,
              partOfSpeech: lexeme.lexicalCategory,
              sense: {
                definition: sense.source.definition,
                ...(parent && { parentDefinition: parent.source.definition }),
                ...(sense.source.examples[0] && {
                  example: sense.source.examples[0],
                }),
              },
            },
            questions: { commonness, learner },
          });
          sense.commonness = answers.commonness.score;
          sense.learner = answers.learner.noul;
          jevTokens += usage.input_tokens;
        }),
      ),
    ).then(() => {
      jevMs = performance.now() - start;
    });

    // OpenAI: senses in chunks, plus one request per origin, all in parallel.
    // Rewriting doesn't depend on the order, so it starts before Jev finishes.
    const usage = { input: 0, cached: 0, output: 0 };
    const retries: string[] = [];
    // When each sense's rewrite finished streaming, keyed `lexeme:id`.
    const completedAt = new Map<string, number>();

    async function edit<T>(
      instructions: string,
      input: unknown,
      schema: z.ZodType<T>,
      name: string,
      onText?: (text: string) => void,
    ): Promise<T> {
      const stream = openai.responses.stream({
        model,
        instructions,
        input: JSON.stringify(input),
        reasoning: { effort },
        text: { format: zodTextFormat(schema, name) },
      });
      let text = '';
      stream.on('response.output_text.delta', ({ delta }) => {
        text += delta;
        onText?.(text);
      });
      const response = await stream.finalResponse();
      usage.input += response.usage?.input_tokens ?? 0;
      usage.cached += response.usage?.input_tokens_details?.cached_tokens ?? 0;
      usage.output += response.usage?.output_tokens ?? 0;
      if (!response.output_parsed) throw new Error(`${word}: no ${name}`);
      return response.output_parsed;
    }

    // Flat, so every sense is one row to rewrite; nested input let the model
    // skip subsenses. parentId keeps the hierarchy visible.
    const toInput = (senses: RankedSense[]) =>
      senses.map((s) => ({
        id: s.id,
        ...(s.id.includes('.') && { parentId: parentId(s.id) }),
        definition: s.source.definition,
        examples: s.source.examples,
        groupsSubsenses: s.subsenses.length > 0,
      }));

    const chunks = lexemes.flatMap((entry, lexemeIndex) => {
      const byId = new Map(flatten(entry.senses).map((s) => [s.id, s]));
      return chunkSenses(entry.senses).map((senses) => ({
        lexemeIndex,
        senses,
        context: contextFor(senses, byId),
      }));
    });

    const [editedChunks, editedOrigins] = await Promise.all([
      Promise.all(
        chunks.map(async ({ lexemeIndex, senses, context }) => {
          const input = {
            headword: word,
            partOfSpeech: lexemes[lexemeIndex].lexeme.lexicalCategory,
            ...(context.length > 0 && {
              context: context.map((s) => ({
                id: s.id,
                definition: s.source.definition,
              })),
            }),
            senses: toInput(senses),
          };
          const keys = senses.map((s) => `${lexemeIndex}:${s.id}`);
          // One retry when a chunk comes back invalid; a retried sense only
          // counts as shown once its retry has streamed in.
          for (let attempt = 1; ; attempt++) {
            const edited = await edit(
              sensesPrompt,
              input,
              EditedSensesSchema,
              'senses',
              (text) => {
                for (const [, id] of text.matchAll(completedSense)) {
                  const key = `${lexemeIndex}:${id}`;
                  if (!completedAt.has(key)) {
                    completedAt.set(key, performance.now() - start);
                  }
                }
              },
            );
            const invalid = chunkProblems(senses, edited.senses);
            if (invalid.length === 0 || attempt === 2) return edited;
            retries.push(`${word}: ${invalid.join('; ')}`);
            for (const key of keys) completedAt.delete(key);
          }
        }),
      ),
      Promise.all(
        article.etymons.map((etymon) =>
          etymon.origin
            ? edit(
                originPrompt,
                { headword: word, origin: etymon.origin },
                EditedOriginSchema,
                'origin',
              ).then((o) => o.origin)
            : Promise.resolve(undefined),
        ),
      ),
      scoring,
    ]);
    const totalMs = performance.now() - start;

    const editedLexemes = lexemes.map((_, i) =>
      chunks.flatMap((chunk, c) =>
        chunk.lexemeIndex === i ? editedChunks[c].senses : [],
      ),
    );

    // Grounding check: every input sense exactly once, nothing added.
    const problems: string[] = [];
    lexemes.forEach((entry, i) => {
      const expected = flatten(entry.senses).map((s) => s.id);
      const actual = editedLexemes[i].map((s) => s.id);
      const missing = expected.filter((id) => !actual.includes(id));
      const extra = actual.filter((id) => !expected.includes(id));
      const duplicated = actual.filter((id, k) => actual.indexOf(id) !== k);
      if (missing.length || extra.length || duplicated.length) {
        problems.push(
          `${entry.lexeme.lexicalCategory}: missing [${missing}] extra [${extra}] duplicated [${duplicated}]`,
        );
      }
    });

    for (const entry of lexemes) entry.senses = rank(entry.senses);
    const etymonRank = article.etymons
      .map((etymon, e) => ({
        etymon,
        e,
        commonness: Math.max(
          ...lexemes
            .filter((l) => l.etymon === e)
            .flatMap((l) => l.senses.map((s) => s.commonness)),
        ),
      }))
      .toSorted((a, b) => b.commonness - a.commonness);

    // Shown senses under a rule, keyed `lexeme:id`. When nothing passes, the
    // article's top sense is shown so it's never empty.
    const shownUnder = (rule: (sense: RankedSense) => boolean) => {
      const shown = new Set(
        lexemes.flatMap((entry, i) =>
          [...visibleSenses(entry.senses, rule)].map((s) => `${i}:${s.id}`),
        ),
      );
      if (shown.size === 0) {
        const top = lexemes.findIndex((l) => l.etymon === etymonRank[0].e);
        shown.add(`${top}:${lexemes[top].senses[0].id}`);
      }
      return shown;
    };
    const visible = shownUnder(showRules[showRule]);
    const shownCounts = Object.fromEntries(
      Object.entries(showRules).map(([name, rule]) => [
        name,
        shownUnder(rule).size,
      ]),
    );

    const price = prices[model];
    const cost =
      (jevTokens * prices.jevInput +
        (usage.input - usage.cached) * price.input +
        usage.cached * price.cachedInput +
        usage.output * price.output) /
      1e6;
    const senseCount = lexemes.reduce(
      (n, l) => n + flatten(l.senses).length,
      0,
    );
    const visibleCount = visible.size;

    // How examples relate to Wiktionary's: reused verbatim, edited (mostly
    // the same words, which the prompt forbids), or newly written.
    const exampleKinds = { reused: 0, edited: 0, written: 0 };
    const words = (text: string) =>
      new Set(text.toLowerCase().match(/[\p{L}']+/gu) ?? []);
    const editedExamples: string[] = [];
    lexemes.forEach((entry, i) => {
      for (const sense of flatten(entry.senses)) {
        const example = editedLexemes[i].find(
          (s) => s.id === sense.id,
        )?.example;
        if (!example) continue;
        if (sense.source.examples.includes(example)) {
          exampleKinds.reused++;
          continue;
        }
        const out = words(example);
        const overlap = sense.source.examples.some((source) => {
          const shared = [...words(source)].filter((w) => out.has(w)).length;
          return shared / Math.max(out.size, 1) >= 0.6;
        });
        if (overlap) {
          exampleKinds.edited++;
          editedExamples.push(example);
        } else exampleKinds.written++;
      }
    });

    // Streaming view: a sense can be shown in its final place once its
    // rewrite has streamed in and Jev's order is known.
    const shownOrder = etymonRank.flatMap(({ e }) =>
      lexemes.flatMap((entry, i) =>
        entry.etymon === e
          ? flatten(entry.senses)
              .map((s) => `${i}:${s.id}`)
              .filter((key) => visible.has(key))
          : [],
      ),
    );
    const readyAt = (keys: string[]) =>
      Math.max(jevMs, ...keys.map((key) => completedAt.get(key) ?? totalMs));
    const firstShownMs = readyAt(shownOrder.slice(0, 1));
    const firstFiveMs = readyAt(shownOrder.slice(0, 5));
    const allShownMs = readyAt(shownOrder);
    const untracked = senseCount - completedAt.size;

    summary.push(
      `| ${word} | ${senseCount} | ${shownCounts.learner} | ${shownCounts.score} | ${chunks.length} | ${seconds(firstShownMs)} | ${seconds(firstFiveMs)} | ${seconds(allShownMs)} | ${seconds(totalMs)} | $${cost.toFixed(4)} |`,
    );

    report.push(
      `## ${word}`,
      ``,
      `${visibleCount} of ${senseCount} senses shown up front · ${chunks.length} chunks · Jev ${seconds(jevMs)} · first sense ${seconds(firstShownMs)} · first 5 ${seconds(firstFiveMs)} · all shown ${seconds(allShownMs)} · total ${seconds(totalMs)} · ${usage.input} in (${usage.cached} cached) / ${usage.output} out · $${cost.toFixed(4)}${untracked ? ` · ⚠ ${untracked} senses not seen streaming` : ''}`,
      ``,
      problems.length
        ? `**Grounding check failed:** ${problems.join('; ')}`
        : `Grounding check passed.`,
      ``,
      retries.length
        ? `**Retried chunks:** ${retries.join(' · ')}`
        : `No retries.`,
      ``,
      `Examples: ${exampleKinds.reused} reused verbatim · ${exampleKinds.written} newly written · ${exampleKinds.edited} edited from Wiktionary${editedExamples.length ? ` (${editedExamples.map((e) => `“${e}”`).join('; ')})` : ''}`,
      ``,
    );

    for (const { etymon, e, commonness: etymonScore } of etymonRank) {
      report.push(
        `### ${word}${article.etymons.length > 1 ? ` (etymology ${e + 1}, commonness ${etymonScore.toFixed(1)})` : ''}`,
        ``,
        `**Origin (Wiktionary):** ${etymon.origin ?? '—'}`,
        ``,
        `**Origin (edited):** ${editedOrigins[e] ?? '—'}`,
        ``,
      );
      lexemes.forEach((entry, i) => {
        if (entry.etymon !== e) return;
        const edited = new Map(editedLexemes[i].map((s) => [s.id, s]));
        report.push(`#### ${entry.lexeme.lexicalCategory}`, ``);
        for (const sense of flatten(entry.senses)) {
          const depth = sense.id.split('.').length - 1;
          const out = edited.get(sense.id);
          const hidden = !visible.has(`${i}:${sense.id}`);
          report.push(
            `${'  '.repeat(depth)}- ${hidden ? '_(show more)_ ' : ''}**${out?.definition ?? '⚠ missing'}**${out?.example ? ` — _${out.example}_` : sense.subsenses.length === 0 ? ' — _(no example)_' : ''}  `,
            `${'  '.repeat(depth)}  <sub>was: ${sense.source.definition} · commonness ${sense.commonness.toFixed(2)} · learner ${sense.learner.toFixed(2)}</sub>`,
          );
        }
        report.push(``);
      });
    }

    console.log(summary.at(-1));
  }

  report.splice(4, 0, ...summary, ``);
  writeFileSync(values.out, report.join('\n'));
  console.log(`Report: ${values.out}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
