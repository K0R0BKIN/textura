// Wiktionary's sense labels, the parenthesized text before a definition such
// as "(chiefly informal)" or "(transitive, computing, Unix)", sorted the way
// Oxford uses them. Oxford shows labels for register (informal, archaic),
// region (British), and subject (Chess) before a definition; says what a
// sense applies to or is used with as part of the definition ("(of a
// person)"); and keeps grammar to codes we don't show.

// Grammar labels, not imported.
const grammar = new Set([
  'transitive',
  'intransitive',
  'ambitransitive',
  'ditransitive',
  'transitive or intransitive',
  'reflexive',
  'ergative',
  'copulative',
  'auxiliary',
  'modal',
  'stative',
  'impersonal',
  'countable',
  'uncountable',
  'countable and uncountable',
  'chiefly uncountable',
  'usually uncountable',
  'chiefly countable',
  'usually countable',
  'not comparable',
  'comparable',
  'attributive',
  'predicative',
  'postpositive',
  'collective',
  'in the plural',
  'chiefly in the plural',
  'usually in the plural',
  'plural only',
  'singular only',
  'usually plural',
  'in the singular',
  'as a modifier',
  'attributively',
  // Wiktionary's own notes on how senses relate, which Oxford leaves out.
  'by extension',
  'metonymic',
  'metonymically',
  'literally',
  'literal',
  'etc.',
  // Pointers to Wiktionary's usage notes, which we don't show.
  'see usage note',
  'see usage notes',
]);

// Labels as stored: the label text of a gloss such as "(chiefly informal) …",
// split on commas, without grammar labels.
export function parseLabels(rawGloss: string, gloss: string): string[] {
  if (!rawGloss.endsWith(gloss)) return [];
  const prefix = rawGloss.slice(0, rawGloss.length - gloss.length).trim();
  const match = /^\((.*)\)$/.exec(prefix);
  if (!match) return [];
  return splitTopLevel(match[1])
    .map((label) => label.trim())
    .filter((label) => label && !grammar.has(label));
}

// Splits on commas outside parentheses: "with and, chiefly informal".
function splitTopLevel(text: string) {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')') depth--;
    else if (text[i] === ',' && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

// Labels that say what a sense applies to or is used with, which Oxford
// writes into the definition: "of a person", "with and", "especially in
// compounds".
const usagePattern =
  /^((chiefly|usually|often|sometimes|especially|mostly) )?(of|with|in|followed|used)\b|^especially\b/;

export function sortLabels(labels: string[]) {
  const shown: string[] = [];
  const usage: string[] = [];
  for (const label of labels) {
    if (usagePattern.test(label)) usage.push(label);
    else shown.push(label === 'figuratively' ? 'figurative' : label);
  }
  return { shown, usage };
}
