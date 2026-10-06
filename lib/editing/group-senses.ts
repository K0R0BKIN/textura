import 'server-only';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import type { Sense } from '@/lib/schemas';

// Arranges a part of speech's senses the way Oxford does: a few core senses,
// each with the senses that come from it as subsenses. Wiktionary lists most
// senses flat, so a big entry is a long list without this. Only the order and
// nesting change, never the senses themselves, so it can't introduce errors
// of fact, and code checks that every sense is placed exactly once.

// Tested on big entries (scripts/test-grouping.mts): Sol with low reasoning
// groups like Oxford; Luna groups worse, and is no faster with reasoning.
const model = 'gpt-6-sol';

// Parts of speech with fewer senses than this are short enough as they are.
export const groupFrom = 6;

// Grouping takes about 4–10 s on the biggest entries. One that takes longer
// is given up on, and the senses keep Wiktionary's order.
const timeout = 25_000;

const prompt = readFileSync(
  join(process.cwd(), 'prompts', 'group-senses.md'),
  'utf8',
);

const openai = new OpenAI({ timeout, maxRetries: 0 });

const OutputSchema = z.object({
  cores: z.array(z.object({ id: z.string(), subsenses: z.array(z.string()) })),
});

export type SenseNode = { id: string; source: Sense; subsenses: SenseNode[] };

// Returns the senses as core senses, each followed by its own subsenses and
// then the senses placed under it. Never fails: senses the model leaves out
// become core senses at the end, and if grouping fails altogether, the senses
// stay as they were.
export async function groupSenses(
  word: string,
  partOfSpeech: string,
  senses: SenseNode[],
): Promise<SenseNode[]> {
  try {
    const response = await openai.responses.parse({
      model,
      reasoning: { effort: 'low' },
      instructions: prompt,
      input: JSON.stringify({
        word,
        partOfSpeech,
        senses: senses.map((sense) => ({
          id: sense.id,
          definition: sense.source.definition,
          ...(sense.subsenses.length > 0 && {
            subsenses: sense.subsenses.map((sub) => sub.source.definition),
          }),
        })),
      }),
      text: { format: zodTextFormat(OutputSchema, 'grouping') },
    });
    const { cores } = response.output_parsed!;

    const byId = new Map(senses.map((sense) => [sense.id, sense]));
    const placed = new Set<string>();
    const grouped: SenseNode[] = [];
    for (const core of cores) {
      const node = byId.get(core.id);
      if (!node || placed.has(core.id)) continue;
      placed.add(core.id);
      const subsenses = core.subsenses.flatMap((id) => {
        const sub = byId.get(id);
        if (!sub || placed.has(id)) return [];
        placed.add(id);
        return [sub];
      });
      grouped.push({ ...node, subsenses: [...node.subsenses, ...subsenses] });
    }
    return [...grouped, ...senses.filter((sense) => !placed.has(sense.id))];
  } catch (error) {
    console.warn(`Grouping ${word} (${partOfSpeech}) failed:`, error);
    return senses;
  }
}
