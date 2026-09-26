import '@/envConfig';
import { createReadStream } from 'node:fs';
import { parseArgs } from 'node:util';
import { createGunzip } from 'node:zlib';
import { sql } from 'drizzle-orm';
import { drizzleDb } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import {
  ArticleSchema,
  HeadwordSchema,
  type Article,
  type Etymon,
  type LexicalCategory,
  type Sense,
  type Variety,
} from '@/lib/schemas';

// Imports English Wiktionary entries from a Kaikki.org wiktextract dump:
// https://kaikki.org/dictionary/English/
//
// Usage:
//   pnpm wiktionary:import <path to .jsonl or .jsonl.gz> [--dry-run]

const variety: Variety = 'en-US';
const batchSize = 250;
const maxExamples = 2;
const maxQuotationLength = 120;

// Subset of the wiktextract entry format that the import reads.
type KaikkiEntry = {
  word: string;
  lang_code: string;
  pos: string;
  etymology_number?: number;
  etymology_text?: string;
  etymology_templates?: KaikkiTemplate[];
  sounds?: { ipa?: string; tags?: string[] }[];
  senses: KaikkiSense[];
};

type KaikkiTemplate = {
  name: string;
  args?: Record<string, string>;
  expansion?: string;
};

type KaikkiSense = {
  glosses?: string[];
  tags?: string[];
  form_of?: unknown[];
  examples?: { text?: string; type?: string }[];
};

const lexicalCategories: Record<string, LexicalCategory> = {
  noun: 'noun',
  name: 'proper noun',
  verb: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  prep: 'preposition',
  conj: 'conjunction',
  pron: 'pronoun',
  det: 'determiner',
  article: 'determiner',
  num: 'numeral',
  intj: 'interjection',
  particle: 'particle',
  phrase: 'phrase',
  prep_phrase: 'phrase',
  proverb: 'phrase',
  abbrev: 'abbreviation',
  contraction: 'contraction',
  prefix: 'prefix',
  suffix: 'suffix',
};

const missingEtymology = '(This etymology is missing or incomplete.';

const stats = {
  entries: 0,
  headwords: 0,
  skippedLanguage: 0,
  skippedFormOf: 0,
  skippedHeadword: 0,
  skippedEmpty: 0,
  unmappedPos: new Map<string, number>(),
  noncontiguous: 0,
  bytes: 0,
};

function isFormOf(sense: KaikkiSense) {
  return sense.form_of !== undefined || sense.tags?.includes('form-of');
}

function getTranscription(entry: KaikkiEntry) {
  const phonemic = (entry.sounds ?? []).filter(
    (sound) => sound.ipa?.startsWith('/') && sound.ipa.endsWith('/'),
  );
  const sound =
    phonemic.find((sound) =>
      sound.tags?.some((tag) => tag === 'General-American' || tag === 'US'),
    ) ?? phonemic.find((sound) => !sound.tags?.length);

  return sound?.ipa?.slice(1, -1);
}

function getExamples(sense: KaikkiSense) {
  const examples = (sense.examples ?? []).flatMap((example) => {
    const text = example.text?.trim();
    return text ? [{ text, type: example.type }] : [];
  });

  const usages = examples.filter((example) => example.type === 'example');
  const quotations = examples.filter(
    (example) =>
      example.type === 'quotation' && example.text.length <= maxQuotationLength,
  );

  return (usages.length > 0 ? usages : quotations)
    .slice(0, maxExamples)
    .map((example) => example.text);
}

// Rebuilds Wiktionary's sense hierarchy from each sense's gloss path.
// Parents that only exist as headings get a node without examples.
function buildSenses(kaikkiSenses: KaikkiSense[]) {
  const senses: Sense[] = [];

  for (const kaikkiSense of kaikkiSenses) {
    const path = kaikkiSense.glosses ?? [];
    if (path.length === 0) continue;

    let siblings = senses;

    for (const [depth, definition] of path.entries()) {
      const isLeaf = depth === path.length - 1;
      const last = siblings.at(-1);

      if (!isLeaf && last?.definition === definition) {
        siblings = last.subsenses;
        continue;
      }

      const sense: Sense = {
        definition,
        examples: isLeaf ? getExamples(kaikkiSense) : [],
        subsenses: [],
      };
      siblings.push(sense);
      siblings = sense.subsenses;
    }
  }

  return senses;
}

// Keeps the etymology prose, dropping the blocks that wiktextract flattens
// into it: the etymology tree before it and the cognates box after it.
function getOrigin(entry: KaikkiEntry) {
  const text = entry.etymology_text?.trim();
  if (!text || text.startsWith(missingEtymology)) return undefined;

  const templates = entry.etymology_templates ?? [];
  let lines = text.split('\n');

  const hasTree = templates.some((template) => template.args?.tree);
  if (hasTree) {
    const treeEnd = lines.indexOf(`English ${entry.word}`);
    if (treeEnd === -1) return undefined;
    lines = lines.slice(treeEnd + 1);
  }

  const cognates = templates.find(
    (template) =>
      template.name.startsWith('col') &&
      Object.values(template.args ?? {}).includes('cog'),
  );
  if (cognates?.expansion) {
    const cognatesStart = lines.indexOf(cognates.expansion);
    if (cognatesStart !== -1) lines = lines.slice(0, cognatesStart);
  }

  return lines.join('\n').trim() || undefined;
}

function buildArticle(word: string, entries: KaikkiEntry[]): Article | null {
  const etymons = new Map<number, Etymon>();

  for (const entry of entries) {
    const lexicalCategory = lexicalCategories[entry.pos];
    if (!lexicalCategory) {
      stats.unmappedPos.set(
        entry.pos,
        (stats.unmappedPos.get(entry.pos) ?? 0) + 1,
      );
      continue;
    }

    if (entry.senses.every(isFormOf)) {
      stats.skippedFormOf++;
      continue;
    }

    const senses = buildSenses(entry.senses);
    if (senses.length === 0) continue;

    const etymologyNumber = entry.etymology_number ?? 0;
    let etymon = etymons.get(etymologyNumber);
    if (!etymon) {
      etymon = { origin: getOrigin(entry), lexemes: [] };
      etymons.set(etymologyNumber, etymon);
    }

    etymon.lexemes.push({
      lexicalCategory,
      transcription: getTranscription(entry),
      senses,
    });
  }

  if (etymons.size === 0) return null;

  return ArticleSchema.parse({
    headword: word,
    variety,
    etymons: [...etymons.values()],
  });
}

// Splits on \n only. node:readline also breaks on U+2028 and U+2029, which
// can appear unescaped inside JSON strings.
async function* readLines(path: string) {
  const file = createReadStream(path);
  const input = path.endsWith('.gz') ? file.pipe(createGunzip()) : file;
  input.setEncoding('utf8');

  let buffer = '';

  for await (const chunk of input as AsyncIterable<string>) {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    yield* lines;
  }

  yield buffer;
}

// wiktextract emits all entries of a Wiktionary page together, so an article
// is complete once the next line belongs to a different word.
async function* readArticles(path: string) {
  const lines = readLines(path);

  const seen = new Set<string>();
  let word: string | undefined;
  let entries: KaikkiEntry[] = [];

  function* flush() {
    if (word === undefined) return;
    if (seen.has(word)) stats.noncontiguous++;
    seen.add(word);

    if (!HeadwordSchema.safeParse({ form: word, variety }).success) {
      stats.skippedHeadword++;
      return;
    }

    const article = buildArticle(word, entries);
    if (article) yield article;
    else stats.skippedEmpty++;
  }

  for await (const line of lines) {
    if (!line.trim()) continue;

    const entry: KaikkiEntry = JSON.parse(line);
    stats.entries++;

    if (entry.lang_code !== 'en') {
      stats.skippedLanguage++;
      continue;
    }

    if (entry.word !== word) {
      yield* flush();
      word = entry.word;
      entries = [];
    }
    entries.push(entry);
  }

  yield* flush();
}

async function writeBatch(batch: Article[]) {
  await drizzleDb
    .insert(articles)
    .values(
      batch.map((article) => ({
        headword: article.headword,
        variety: article.variety,
        data: article,
      })),
    )
    .onConflictDoUpdate({
      target: [articles.headword, articles.variety],
      set: { data: sql`excluded.data` },
    });
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { 'dry-run': { type: 'boolean', default: false } },
  });

  const [path] = positionals;
  if (!path) {
    throw new Error(
      'Usage: pnpm wiktionary:import <path to .jsonl or .jsonl.gz> [--dry-run]',
    );
  }

  const dryRun = values['dry-run'];

  if (!dryRun) {
    await drizzleDb.delete(articles);
  }

  let batch: Article[] = [];

  for await (const article of readArticles(path)) {
    stats.headwords++;
    stats.bytes += Buffer.byteLength(JSON.stringify(article));

    if (dryRun) continue;

    batch.push(article);
    if (batch.length === batchSize) {
      await writeBatch(batch);
      batch = [];
      console.log(`Imported ${stats.headwords} headwords…`);
    }
  }

  if (!dryRun && batch.length > 0) await writeBatch(batch);

  console.log({
    ...stats,
    megabytes: Math.round(stats.bytes / 1024 / 1024),
    unmappedPos: Object.fromEntries(stats.unmappedPos),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
