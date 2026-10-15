// Optimized cost experiment through the real Batch API: several words per call,
// trimmed input, and origins with and without quotes.
//   node --env-file=<.env.local> batch.mjs build|submit|collect
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import OpenAI from 'openai';

const dir = new URL('.', import.meta.url).pathname;
const client = new OpenAI();
const model = 'gpt-6-luna';
const ORIGINS_PER_CALL = 10;
const SENSES_PER_CALL = 28;
const GROUP_FROM = 6;
const EXAMPLE_CHARS = 150;

const read = (name) => readFileSync(`${dir}prompts/${name}.md`, 'utf8');
const packed = '\n\nItems may come from several different words; each item gives its own `headword`. Treat each word separately.';
const originPrompt = read('edit-origin') + packed;
// The same prompt without the quotes: each sentence is just its text.
const originNoQuotesPrompt = originPrompt
  .replace(/Return each etymology as a list of `sentences`\.[^\n]*/, 'Return each etymology as a list of `sentences`, each with its `text`. Every fact in a sentence must come from the source text.');
const prompts = { origin: originPrompt, originNoQuotes: originNoQuotesPrompt, senses: read('edit-senses') + packed, group: read('group-senses') };

const str = { type: 'string' };
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const arr = (items) => ({ type: 'array', items });
const schemas = {
  origin: obj({ items: arr(obj({ id: str, sentences: arr(obj({ text: str, quotes: arr(str) })) })) }),
  originNoQuotes: obj({ items: arr(obj({ id: str, sentences: arr(obj({ text: str })) })) }),
  senses: obj({ items: arr(obj({ id: str, definition: str })) }),
  group: obj({ cores: arr(obj({ id: str, subsenses: arr(str) })) }),
};

function request(id, kind, input) {
  return {
    custom_id: id,
    method: 'POST',
    url: '/v1/responses',
    body: {
      model,
      instructions: prompts[kind],
      input: JSON.stringify(input),
      reasoning: { effort: 'none' },
      text: { format: { type: 'json_schema', name: kind, schema: schemas[kind], strict: true } },
    },
  };
}

function build() {
  const words = readFileSync(`${dir}sample.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const requests = [];
  const expected = {};
  const origins = words.flatMap((w, i) => w.etymologies.map((e) => ({ id: `w${i}:${e.id}`, headword: w.word, text: e.text, partsOfSpeech: e.partsOfSpeech })));
  for (let i = 0; i < origins.length; i += ORIGINS_PER_CALL) {
    const items = origins.slice(i, i + ORIGINS_PER_CALL);
    for (const kind of ['origin', 'originNoQuotes']) {
      const id = `${kind}-${i}`;
      requests.push(request(id, kind, { items }));
      expected[id] = items.map((x) => x.id);
    }
  }
  // Senses: whole parts of speech packed together, split only when one is too big.
  const lexemes = words.flatMap((w, i) => w.lexemes.map((l) => l.senses.map((s) => ({
    id: `w${i}:${s.id}`, headword: w.word, partOfSpeech: l.pos, definition: s.definition,
    ...(s.labels.length ? { labels: s.labels } : {}),
    examples: s.examples.slice(0, 1).map((x) => x.slice(0, EXAMPLE_CHARS)),
  }))));
  let batch = [];
  const flush = () => { if (batch.length) { const id = `senses-${requests.length}`; requests.push(request(id, 'senses', { items: batch })); expected[id] = batch.map((x) => x.id); batch = []; } };
  for (const senses of lexemes) {
    for (let i = 0; i < senses.length; i += SENSES_PER_CALL) {
      const part = senses.slice(i, i + SENSES_PER_CALL);
      if (batch.length + part.length > SENSES_PER_CALL) flush();
      batch.push(...part);
    }
  }
  flush();
  words.forEach((w, i) => w.lexemes.forEach((l, li) => {
    if (l.senses.length < GROUP_FROM) return;
    const id = `group-w${i}-${li}`;
    requests.push(request(id, 'group', { word: w.word, partOfSpeech: l.pos, senses: l.senses.map(({ id, definition, labels }) => ({ id, definition, labels })) }));
    expected[id] = l.senses.map((s) => s.id);
  }));
  writeFileSync(`${dir}batch-input.jsonl`, requests.map((r) => JSON.stringify(r)).join('\n') + '\n');
  writeFileSync(`${dir}batch-expected.json`, JSON.stringify(expected));
  const count = (k) => requests.filter((r) => r.custom_id.startsWith(k)).length;
  console.log(`${requests.length} requests: origin ${count('origin-')}, originNoQuotes ${count('originNoQuotes')}, senses ${count('senses')}, group ${count('group')}`);
}

async function submit() {
  const file = await client.files.create({ file: await OpenAI.toFile(readFileSync(`${dir}batch-input.jsonl`), 'batch-input.jsonl'), purpose: 'batch' });
  const batch = await client.batches.create({ input_file_id: file.id, endpoint: '/v1/responses', completion_window: '24h' });
  writeFileSync(`${dir}batch-id.txt`, batch.id);
  console.log('submitted', batch.id, batch.status);
}

async function collect() {
  const batch = await client.batches.retrieve(readFileSync(`${dir}batch-id.txt`, 'utf8').trim());
  console.log(batch.status, batch.request_counts);
  if (batch.status !== 'completed') return;
  const text = await (await client.files.content(batch.output_file_id)).text();
  writeFileSync(`${dir}batch-output.jsonl`, text);
  if (batch.error_file_id) writeFileSync(`${dir}batch-errors.jsonl`, await (await client.files.content(batch.error_file_id)).text());
  console.log('saved output', existsSync(`${dir}batch-errors.jsonl`) ? '(with errors file)' : '');
}

await { build, submit, collect }[process.argv[2]]();
