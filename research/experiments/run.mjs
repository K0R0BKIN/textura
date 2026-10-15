// Cost experiment: rewrites sample words the way a bulk run would, and
// records the token usage the API reports for every call.
//   node --env-file=<.env.local> run.mjs sample.jsonl results.jsonl
import { readFileSync, appendFileSync, writeFileSync } from 'node:fs';
import OpenAI from 'openai';
import pLimit from 'p-limit';

const [, , samplePath, outPath] = process.argv;
const client = new OpenAI();
const model = 'gpt-6-luna';
const prompt = (name) => readFileSync(new URL(`prompts/${name}.md`, import.meta.url), 'utf8');
const prompts = { origin: prompt('edit-origin'), senses: prompt('edit-senses'), group: prompt('group-senses') };
const chunkSize = 28;
const groupFrom = 6;

const str = { type: 'string' };
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const arr = (items) => ({ type: 'array', items });
const schemas = {
  origin: obj({ items: arr(obj({ id: str, sentences: arr(obj({ text: str, quotes: arr(str) })) })) }),
  senses: obj({ items: arr(obj({ id: str, definition: str })) }),
  group: obj({ cores: arr(obj({ id: str, subsenses: arr(str) })) }),
};

async function call(kind, input) {
  const started = Date.now();
  const response = await client.responses.create({
    model,
    instructions: prompts[kind],
    input: JSON.stringify(input),
    reasoning: { effort: 'none' },
    text: { format: { type: 'json_schema', name: kind, schema: schemas[kind], strict: true } },
  });
  const u = response.usage;
  return {
    kind,
    ms: Date.now() - started,
    input: u.input_tokens,
    cached: u.input_tokens_details?.cached_tokens ?? 0,
    output: u.output_tokens,
    text: response.output_text,
  };
}

// One sample line: { word, zipf, band, etymologies: [{id, text, partsOfSpeech}],
// lexemes: [{pos, senses: [{id, definition, labels, examples}]}] }
async function rewrite(entry) {
  const jobs = [];
  if (entry.etymologies.length > 0) {
    jobs.push(call('origin', { headword: entry.word, items: entry.etymologies }));
  }
  for (const lexeme of entry.lexemes) {
    for (let i = 0; i < lexeme.senses.length; i += chunkSize) {
      const items = lexeme.senses.slice(i, i + chunkSize).map((s) => ({ ...s, partOfSpeech: lexeme.pos }));
      jobs.push(call('senses', { headword: entry.word, items }));
    }
    if (lexeme.senses.length >= groupFrom) {
      jobs.push(call('group', {
        word: entry.word,
        partOfSpeech: lexeme.pos,
        senses: lexeme.senses.map(({ id, definition, labels }) => ({ id, definition, labels })),
      }));
    }
  }
  const calls = await Promise.all(jobs);
  return { word: entry.word, zipf: entry.zipf, band: entry.band, sourceChars: entry.sourceChars, calls };
}

const entries = readFileSync(samplePath, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
writeFileSync(outPath, '');
const limit = pLimit(12);
let done = 0;
await Promise.all(entries.map((entry) => limit(async () => {
  try {
    appendFileSync(outPath, JSON.stringify(await rewrite(entry)) + '\n');
  } catch (error) {
    console.error(entry.word, error.message);
  }
  if (++done % 20 === 0) process.stdout.write(`${done}/${entries.length} `);
})));
console.log('done');
