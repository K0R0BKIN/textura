// Grouping experiment: several model/input/prompt variants on the same parts
// of speech, each scored 1–5 by a blind judge against Oxford's entry.
//   node --env-file=<.env.local> group-exp.mjs [variant ...]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import OpenAI from 'openai';
import pLimit from 'p-limit';

const client = new OpenAI();
const inputs = JSON.parse(readFileSync('group-inputs.json', 'utf8'));
const oxford = Object.fromEntries(readFileSync('oxford-set.txt', 'utf8').split('=== ').slice(1)
  .map((c) => [c.split('\n')[0].trim(), c.split('\n').slice(1).join('\n').slice(0, 7000)]));
const prompt = (v) => readFileSync(`prompts/${v}.md`, 'utf8');

const str = { type: 'string' };
const obj = (p) => ({ type: 'object', properties: p, required: Object.keys(p), additionalProperties: false });
const groupSchema = obj({ cores: { type: 'array', items: obj({ id: str, subsenses: { type: 'array', items: str } }) } });
const judgeSchema = obj({ reason: str, score: { type: 'integer' } });

const variants = {
  A: { model: 'gpt-6-luna', input: 'flat', prompt: 'group-senses' },
  B: { model: 'gpt-6-luna', input: 'nested', prompt: 'group-senses' },
  C: { model: 'gpt-6-luna', input: 'nested', prompt: 'group-senses-v2' },
  D: { model: 'gpt-6-sol', input: 'nested', prompt: 'group-senses' },
  E: { model: 'gpt-6-sol', input: 'nested', prompt: 'group-senses-v2' },
  F: { model: 'gpt-6-luna', input: 'nested', prompt: 'group-senses-v3' },
};

async function group(v, lex) {
  const cfg = variants[v];
  const res = await client.responses.create({
    model: cfg.model,
    instructions: prompt(cfg.prompt),
    input: JSON.stringify({ word: lex.word, partOfSpeech: lex.partOfSpeech, senses: lex[cfg.input] }),
    reasoning: { effort: 'none' },
    text: { format: { type: 'json_schema', name: 'group', schema: groupSchema, strict: true } },
  });
  let cores = [];
  try { cores = JSON.parse(res.output_text).cores; } catch {}
  return { cores, usage: { input: res.usage.input_tokens, cached: res.usage.input_tokens_details?.cached_tokens ?? 0, output: res.usage.output_tokens } };
}

// Renders a grouping as text: cores with their subsenses (and Wiktionary's own
// nested subsenses under those), so the judge sees only definitions.
function render(lex, cores) {
  const byId = Object.fromEntries(lex.flat.map((s) => [s.id, s]));
  const nestedKids = {};
  for (const top of lex.nested) for (const sub of top.subsenses ?? []) (nestedKids[top.id] ??= []).push(sub.id);
  const line = (id, depth) => [`${'  '.repeat(depth)}- ${byId[id]?.labels ? `(${byId[id].labels.join(', ')}) ` : ''}${byId[id]?.definition ?? `[unknown id ${id}]`}`,
    ...(nestedKids[id] ?? []).map((k) => line(k, depth + 1))].join('\n');
  const placed = new Set(cores.flatMap((c) => [c.id, ...c.subsenses]));
  const missing = lex.nested.filter((s) => !placed.has(s.id)).length;
  return cores.map((c, i) => `${i + 1}. ${line(c.id, 0).slice(2)}\n${c.subsenses.map((s) => line(s, 1)).join('\n')}`).join('\n')
    + (missing ? `\n[${missing} senses were not placed]` : '');
}

async function judge(lex, grouping) {
  const res = await client.responses.create({
    model: 'gpt-6-sol',
    reasoning: { effort: 'medium' },
    instructions: `You review how a dictionary entry's senses are organized. You get the senses of one part of speech of an English word, organized into numbered core senses with subsenses (indented), and, for reference, the New Oxford American Dictionary's entry for the word. The senses come from Wiktionary, so there may be more of them than in Oxford; judge only the organization, not the wording or which senses exist.

Score 1–5:
5 = organized as Oxford would: the cores are the central meanings, each subsense sits under the core it comes from, unrelated senses are separate.
4 = minor issues: one or two senses misplaced, or one core that should be a subsense.
3 = usable but clearly too fragmented, or several senses under the wrong core.
2 = mostly fragmented or many misplaced senses.
1 = no useful structure.
Give a one-sentence reason, then the score.`,
    input: `Word: ${lex.word} (${lex.partOfSpeech})\n\nOrganization to review:\n${grouping}\n\nOxford's entry (reference):\n${oxford[lex.word] ?? 'not available'}`,
    text: { format: { type: 'json_schema', name: 'judge', schema: judgeSchema, strict: true } },
  });
  return JSON.parse(res.output_text);
}

const run = process.argv.slice(2);
const outFile = 'group-exp.json';
const results = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : [];
const limit = pLimit(12);
await Promise.all(run.flatMap((v) => inputs.map((lex) => limit(async () => {
  try {
    const g = await group(v, lex);
    const text = render(lex, g.cores);
    const j = await judge(lex, text);
    results.push({ variant: v, word: lex.word, pos: lex.partOfSpeech, senses: lex.flat.length, cores: g.cores.length, usage: g.usage, score: j.score, reason: j.reason, text });
  } catch (e) { console.error(v, lex.word, e.message); }
}))));
writeFileSync(outFile, JSON.stringify(results, null, 1));
const P = { 'gpt-6-luna': [0.05, 0.005, 0.25], 'gpt-6-sol': [1, 0.1, 5] };
for (const v of Object.keys(variants)) {
  const rs = results.filter((r) => r.variant === v);
  if (!rs.length) continue;
  const [pi, pc, po] = P[variants[v].model];
  const cost = rs.reduce((s, r) => s + ((r.usage.input - r.usage.cached) * pi + r.usage.cached * pc + r.usage.output * po) / 1e6, 0) / rs.length;
  const scores = rs.map((r) => r.score);
  const dist = [1, 2, 3, 4, 5].map((k) => scores.filter((s) => s === k).length).join('/');
  console.log(`${v} ${JSON.stringify(variants[v])}: mean score ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)} (1/2/3/4/5: ${dist}), mean cores ${(rs.reduce((s, r) => s + r.cores, 0) / rs.length).toFixed(1)}, batch $ for all 11,279 ≈ ${(cost * 11279).toFixed(2)}`);
}
