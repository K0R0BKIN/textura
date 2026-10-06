import 'server-only';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSONParser } from '@streamparser/json';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import type { Sense } from '@/lib/schemas';
import { channel } from './channel';

// Arranges a part of speech's senses the way Oxford does: a few core senses,
// each with the senses that come from it as subsenses. Wiktionary lists most
// senses flat, so a big entry is a long list without this. Only the order and
// nesting change, never the senses themselves, so it can't introduce errors
// of fact, and code checks that every sense is placed exactly once.

// Tested on big entries (scripts/test-grouping.mts): Sol groups like Oxford.
// With low reasoning it's a little better at keeping unrelated senses apart,
// but takes 4–10 s; without, the first core sense arrives in about 1.5–2.5 s
// and the rest stream after it. Luna groups worse.
const model = 'gpt-6-sol';

// Parts of speech with fewer senses than this are short enough as they are.
export const groupFrom = 6;

// Grouping takes about 2.5–4.5 s on the biggest entries. One that takes
// longer is given up on, and the senses not yet placed keep Wiktionary's
// order.
const timeout = 15_000;

const prompt = readFileSync(
  join(process.cwd(), 'prompts', 'group-senses.md'),
  'utf8',
);

const openai = new OpenAI({ maxRetries: 0 });

const OutputSchema = z.object({
  cores: z.array(z.object({ id: z.string(), subsenses: z.array(z.string()) })),
});

export type SenseNode = { id: string; source: Sense; subsenses: SenseNode[] };

// Yields the senses as core senses, as each arrives: a core sense with its
// own subsenses, then the senses placed under it. Never fails: senses the
// model leaves out, or doesn't get to, follow as core senses of their own.
export function groupSenses(
  word: string,
  partOfSpeech: string,
  senses: SenseNode[],
): AsyncIterable<SenseNode> {
  const cores = channel<SenseNode>();
  const byId = new Map(senses.map((sense) => [sense.id, sense]));
  const placed = new Set<string>();

  const place = (core: { id: string; subsenses: string[] }) => {
    const node = byId.get(core.id);
    if (!node || placed.has(core.id)) return;
    placed.add(core.id);
    const subsenses = core.subsenses.flatMap((id) => {
      const sub = byId.get(id);
      if (!sub || placed.has(id)) return [];
      placed.add(id);
      return [sub];
    });
    cores.push({ ...node, subsenses: [...node.subsenses, ...subsenses] });
  };

  const parser = new JSONParser({ paths: ['$.cores.*'] });
  parser.onValue = ({ value }) => {
    const core = value as { id?: unknown; subsenses?: unknown };
    if (typeof core.id === 'string' && Array.isArray(core.subsenses)) {
      place({
        id: core.id,
        subsenses: core.subsenses.filter((id) => typeof id === 'string'),
      });
    }
  };

  // Done as soon as the JSON is complete: the model sometimes keeps writing
  // after it.
  let stream: ReturnType<typeof openai.responses.stream> | undefined;
  parser.onEnd = () => stream?.abort();
  const timer = setTimeout(() => stream?.abort(), timeout);

  (async () => {
    stream = openai.responses.stream({
      model,
      reasoning: { effort: 'none' },
      instructions: prompt,
      input: JSON.stringify({
        word,
        partOfSpeech,
        senses: senses.map((sense) => ({
          id: sense.id,
          ...(sense.source.labels.length > 0 && {
            labels: sense.source.labels,
          }),
          definition: sense.source.definition,
          ...(sense.subsenses.length > 0 && {
            subsenses: sense.subsenses.map((sub) => sub.source.definition),
          }),
        })),
      }),
      text: { format: zodTextFormat(OutputSchema, 'grouping') },
    });
    stream.on('response.output_text.delta', ({ delta }) => {
      if (parser.isEnded) return;
      try {
        parser.write(delta);
      } catch {
        stream?.abort();
      }
    });
    await stream.finalResponse();
  })()
    .catch((error: unknown) => {
      if (parser.isEnded) return;
      console.warn(`Grouping ${word} (${partOfSpeech}) failed:`, error);
    })
    .finally(() => {
      clearTimeout(timer);
      for (const sense of senses) if (!placed.has(sense.id)) cores.push(sense);
      cores.close();
    });

  return cores;
}
