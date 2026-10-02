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
// (read-only), ranks senses with Jev, then rewrites the article in parallel
// chunks cut in display order, and writes a Markdown report with a simulated
// top-to-bottom playback. Nothing is stored.
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

// Items are packed into chunks of about this many output tokens, each a
// parallel request.
const chunkTokens = 300;

// How fast the page reveals text that has already been written.
const revealCharsPerSecond = 2500;

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

const EditedArticleSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
    }),
  ),
});

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

// Rough output size of an item: a rewritten definition or a condensed
// etymology, plus JSON.
function estimateTokens(
  item:
    | { kind: 'origin'; text: string }
    | { kind: 'sense'; definition: string; examples: string[] },
) {
  return item.kind === 'origin'
    ? Math.min(item.text.length / 8, 150) + 20
    : item.definition.length / 4 + 15;
}

// A completed item object in streamed JSON output.
const completedItem = /\{"id":"([^"]+)","text":"(?:[^"\\]|\\.)*"\}/g;

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
  const prompt = readFileSync('prompts/edit-senses.md', 'utf8');

  const report: string[] = [
    `# Editing pilot`,
    ``,
    `Model: \`${model}\`, reasoning effort: \`${effort}\`, Jev: \`jev-latest\`, shown by: \`${showRule}\` rule. Chunks of ~${chunkTokens} tokens in display order, played back in sequence at ${revealCharsPerSecond} chars/s.`,
    ``,
  ];
  const summary: string[] = [
    `| Word | Senses | Shown | Chunks | Jev | First text | First shown sense | Shown part on screen | Longest wait | "Show more" ready | Cost |`,
    `|---|---|---|---|---|---|---|---|---|---|---|`,
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
    // Item ids: `o1` for the first etymology, `2:1.3` for sense 1.3 of the
    // second part of speech.
    const senseKey = (lexemeIndex: number, id: string) =>
      `${lexemeIndex + 1}:${id}`;

    const start = performance.now();
    const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

    // Jev first: the rewrite streams in display order, so it needs the order.
    let jevTokens = 0;
    await Promise.all(
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
    );
    const jevMs = performance.now() - start;

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

    // Shown senses under the rule. When nothing passes, the article's top
    // sense is shown so it's never empty.
    const visible = new Set(
      lexemes.flatMap((entry, i) =>
        [...visibleSenses(entry.senses, showRules[showRule])].map((s) =>
          senseKey(i, s.id),
        ),
      ),
    );
    if (visible.size === 0) {
      const top = lexemes.findIndex((l) => l.etymon === etymonRank[0].e);
      visible.add(senseKey(top, lexemes[top].senses[0].id));
    }

    // Input items in display order: each etymology with its shown senses,
    // then every hidden sense, so the visible article streams first.
    type InputItem =
      | { id: string; kind: 'origin'; text: string }
      | {
          id: string;
          kind: 'sense';
          partOfSpeech: string;
          parentId?: string;
          definition: string;
          examples: string[];
          groupsSubsenses: boolean;
        };
    const senseItem = (i: number, s: RankedSense): InputItem => ({
      id: senseKey(i, s.id),
      kind: 'sense',
      partOfSpeech: lexemes[i].lexeme.lexicalCategory,
      ...(s.id.includes('.') && { parentId: senseKey(i, parentId(s.id)) }),
      definition: s.source.definition,
      examples: s.source.examples,
      groupsSubsenses: s.subsenses.length > 0,
    });
    const displayOrder = etymonRank.flatMap(({ etymon, e }) => [
      ...(etymon.origin
        ? [{ id: `o${e + 1}`, kind: 'origin' as const, text: etymon.origin }]
        : []),
      ...lexemes.flatMap((entry, i) =>
        entry.etymon === e
          ? flatten(entry.senses).map((s) => senseItem(i, s))
          : [],
      ),
    ]);
    const shownItems = displayOrder.filter(
      (item) => item.kind === 'origin' || visible.has(item.id),
    );
    const hiddenItems = displayOrder.filter(
      (item) => item.kind === 'sense' && !visible.has(item.id),
    );
    const items = [...shownItems, ...hiddenItems];

    // Chunks in display order, all requested at once. The page plays them
    // back one after another, so the article still reads top to bottom.
    const chunks: InputItem[][] = [];
    let size = chunkTokens;
    for (const item of items) {
      const itemSize = estimateTokens(item);
      if (size + itemSize > chunkTokens) {
        chunks.push([]);
        size = 0;
      }
      chunks.at(-1)!.push(item);
      size += itemSize;
    }
    const byId = new Map(items.map((item) => [item.id, item]));

    const usage = { input: 0, cached: 0, output: 0 };
    const completedAt = new Map<string, number>();
    let firstTextMs = Infinity;
    const retries: string[] = [];

    const editedChunks = await Promise.all(
      chunks.map(async (chunk, c) => {
        // Parents rewritten in another chunk, sent for context only.
        const ids = new Set(chunk.map((item) => item.id));
        const context = [
          ...new Set(
            chunk.flatMap((item) =>
              item.kind === 'sense' && item.parentId && !ids.has(item.parentId)
                ? [item.parentId]
                : [],
            ),
          ),
        ].map((id) => byId.get(id)!);
        const input = {
          headword: word,
          ...(context.length > 0 && { context }),
          items: chunk,
        };

        for (let attempt = 1; ; attempt++) {
          for (const id of ids) completedAt.delete(id);
          const stream = openai.responses.stream({
            model,
            instructions: prompt,
            input: JSON.stringify(input),
            reasoning: { effort },
            text: { format: zodTextFormat(EditedArticleSchema, 'article') },
          });
          let text = '';
          stream.on('response.output_text.delta', ({ delta }) => {
            if (c === 0) {
              firstTextMs = Math.min(firstTextMs, performance.now() - start);
            }
            text += delta;
            for (const [, id] of text.matchAll(completedItem)) {
              if (!completedAt.has(id)) {
                completedAt.set(id, performance.now() - start);
              }
            }
          });
          const response = await stream.finalResponse();
          usage.input += response.usage?.input_tokens ?? 0;
          usage.cached +=
            response.usage?.input_tokens_details?.cached_tokens ?? 0;
          usage.output += response.usage?.output_tokens ?? 0;
          const edited = response.output_parsed?.items ?? [];

          const expected = chunk.map((item) => item.id);
          const actual = edited.map((item) => item.id);
          const problems = [
            ...expected
              .filter((id) => !actual.includes(id))
              .map((id) => `${id} missing`),
            ...actual
              .filter(
                (id, k) => !expected.includes(id) || actual.indexOf(id) !== k,
              )
              .map((id) => `${id} unexpected`),
          ];
          if (
            problems.length === 0 &&
            actual.some((id, k) => id !== expected[k])
          ) {
            problems.push('items reordered');
          }
          if (problems.length === 0 || attempt === 2) return edited;
          retries.push(`chunk ${c + 1}: ${problems.join('; ')}`);
        }
      }),
    );
    const totalMs = performance.now() - start;
    const edited = editedChunks.flat();
    const editedById = new Map(edited.map((item) => [item.id, item]));

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

    // Simulated playback: shown items appear in order. An item that is still
    // being written types in live; one already written is revealed from the
    // buffer at revealCharsPerSecond. A wait happens when playback reaches a
    // later chunk that hasn't written the item yet.
    const chunkOf = new Map(
      chunks.flatMap((chunk, c) => chunk.map((item) => [item.id, c])),
    );
    let playbackMs = firstTextMs;
    let longestWaitMs = 0;
    let firstShownSenseMs = totalMs;
    for (const item of shownItems) {
      const out = editedById.get(item.id);
      const examples = item.kind === 'sense' ? item.examples.join(' ') : '';
      const chars = (out?.text.length ?? 0) + examples.length;
      const buffered = playbackMs + (chars / revealCharsPerSecond) * 1000;
      const written = completedAt.get(item.id) ?? totalMs;
      if (chunkOf.get(item.id)! > 0) {
        longestWaitMs = Math.max(longestWaitMs, written - buffered);
      }
      playbackMs = Math.max(buffered, written);
      if (item.kind === 'sense' && firstShownSenseMs === totalMs) {
        firstShownSenseMs = playbackMs;
      }
    }
    const shownDoneMs = playbackMs;
    const showMoreReadyMs = Math.max(
      0,
      ...hiddenItems.map((item) => completedAt.get(item.id) ?? totalMs),
    );

    summary.push(
      `| ${word} | ${senseCount} | ${visible.size} | ${chunks.length} | ${seconds(jevMs)} | ${seconds(firstTextMs)} | ${seconds(firstShownSenseMs)} | ${seconds(shownDoneMs)} | ${seconds(Math.max(0, longestWaitMs))} | ${seconds(showMoreReadyMs)} | $${cost.toFixed(4)} |`,
    );

    report.push(
      `## ${word}`,
      ``,
      `${visible.size} of ${senseCount} senses shown up front · ${chunks.length} chunks · Jev ${seconds(jevMs)} · first text ${seconds(firstTextMs)} · first shown sense ${seconds(firstShownSenseMs)} · shown part on screen ${seconds(shownDoneMs)} · longest wait ${seconds(Math.max(0, longestWaitMs))} · show more ready ${seconds(showMoreReadyMs)} · all done ${seconds(totalMs)} · ${usage.input} in (${usage.cached} cached) / ${usage.output} out · $${cost.toFixed(4)}`,
      ``,
      retries.length
        ? `**Retried:** ${retries.join(' · ')}`
        : `Every item kept exactly once, in order.`,
      ``,
    );

    for (const { etymon, e, commonness: etymonScore } of etymonRank) {
      report.push(
        `### ${word}${article.etymons.length > 1 ? ` (etymology ${e + 1}, commonness ${etymonScore.toFixed(1)})` : ''}`,
        ``,
        `**Origin (Wiktionary):** ${etymon.origin ?? '—'}`,
        ``,
        `**Origin (edited):** ${editedById.get(`o${e + 1}`)?.text ?? '—'}`,
        ``,
      );
      lexemes.forEach((entry, i) => {
        if (entry.etymon !== e) return;
        report.push(`#### ${entry.lexeme.lexicalCategory}`, ``);
        for (const sense of flatten(entry.senses)) {
          const depth = sense.id.split('.').length - 1;
          const out = editedById.get(senseKey(i, sense.id));
          const hidden = !visible.has(senseKey(i, sense.id));
          report.push(
            `${'  '.repeat(depth)}- ${hidden ? '_(show more)_ ' : ''}**${out?.text ?? '⚠ missing'}**${sense.source.examples.length ? ` — _${sense.source.examples.join('_ · _')}_` : ''}  `,
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
