// Measures how often Wiktionary's etymologies say when a word entered
// English, which Oxford's origins always open with. Run with:
//   node --env-file=.env.local --import tsx scripts/measure-origin-dates.mts
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

const testWords =
  'take set head light ring word go run cool line play bank check nice sky awful girl algebra coffee ketchup tea shampoo pajamas chocolate zero sandwich quark laser google fog jazz'.split(
    ' ',
  );

const patterns = {
  englishStage: /\b(Old|Middle|Early Modern) English\b/,
  date: /\b(1[0-9]{3}s?|[0-9]{1,2}(st|nd|rd|th)[- ]century|centur(y|ies))\b|\battested\b/i,
};

async function measure(label: string, origins: string[]) {
  const counts = Object.fromEntries(
    Object.entries(patterns).map(([name, pattern]) => [
      name,
      origins.filter((origin) => pattern.test(origin)).length,
    ]),
  );
  const neither = origins.filter(
    (origin) =>
      !Object.values(patterns).some((pattern) => pattern.test(origin)),
  );
  const percent = (n: number) => `${Math.round((n / origins.length) * 100)}%`;
  console.log(
    `${label}: ${origins.length} origins; English stage ${percent(counts.englishStage)}, date ${percent(counts.date)}, neither ${percent(neither.length)}`,
  );
  return neither;
}

const testRows = (await sql`
  select headword, json_array_elements(data->'etymons')->>'origin' as origin
  from articles where variety = 'en-US' and headword = any(${testWords})
`) as { headword: string; origin: string | null }[];
const testOrigins = testRows.filter((row) => row.origin);
const neither = await measure(
  'Test words',
  testOrigins.map((row) => row.origin!),
);
for (const row of testOrigins) {
  if (neither.includes(row.origin!)) {
    console.log(`  ${row.headword}: ${row.origin!.slice(0, 140)}`);
  }
}

const sample = (await sql`
  select json_array_elements(data->'etymons')->>'origin' as origin
  from articles tablesample system (1)
  where variety = 'en-US'
`) as { origin: string | null }[];
await measure(
  'Random 1% of articles',
  sample.flatMap((row) => (row.origin ? [row.origin] : [])),
);
