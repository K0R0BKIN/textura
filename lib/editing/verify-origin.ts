import 'server-only';

import { noul, TypeSafeClient } from '@typesafe-ai/sdk';
import { hedged } from './hedge';

// Checks rewritten etymologies against their Wiktionary source, sentence by
// sentence, so that nothing reaches the reader that the source doesn't say.
// Each sentence comes with quotes from the source. Code checks that the quotes
// and the words the sentence cites exist in the source, which catches invented
// facts for free, then Jev checks that the sentence adds or changes nothing.
// Calibrated on sentences judged by hand, this catches added facts, made-up
// dates, and reversed or reworded hedges; it can miss a mix-up between two
// words the source both names.

export type CitedSentence = { text: string; quotes: string[] };

export type SentenceCheck = { ok: true } | { ok: false; reason: string };

// Jev's probability that a sentence adds or changes something, at or above
// which the sentence fails.
const failFrom = 0.65;

// A check that hasn't answered after this long gets a duplicate request, and
// the first answer wins (see hedge.ts).
const hedgeAfter = 2_000;

const jev = new TypeSafeClient({
  apiKey: process.env.TYPESAFEAI_API_KEY,
  timeout: 5_000,
  retry: { maxRetries: 2 },
});

const checks = {
  added: noul(
    'Does `sentence` state anything about the word that `source` does not: a fact, word, language, date, person, or meaning? Rewording, summarizing, and leaving things out do not count. Referring to the same word\'s other etymologies in `otherSources`, such as "from the noun", is fine.',
  ),
  changed: noul(
    "Does `sentence` change what `source` says: how certain a claim is, or which word came from which? Leaving out intermediate stages, such as a Middle English form between the Old English word and today's, does not count.",
  ),
};

// Quotes are matched loosely: case, spacing, quotation marks, dashes, and
// surrounding punctuation don't matter.
function normalize(text: string) {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[“”„«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,;:]+|[\s.,;:]+$/g, '');
}

// A `*` outside italics, or a proto-language, is a reconstructed form.
function hasReconstructedForm(text: string) {
  return /\bProto-|\*/.test(text.replace(/\*[^*\n]+\*/g, ''));
}

// Words a sentence cites in italics must be the headword or appear in the
// sources as cited words, not only inside a gloss in quotation marks.
function uncitedWords(text: string, headword: string, sources: string[]) {
  const cited = normalize(
    [headword, ...sources].join('\n').replace(/“[^”]*”/g, ' '),
  );
  return [...text.matchAll(/\*([^*\n]+)\*/g)]
    .map((match) => normalize(match[1]))
    .filter((word) => {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return !new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, 'u').test(
        cited,
      );
    });
}

export async function checkSentence(
  headword: string,
  sentence: CitedSentence,
  source: string,
  otherSources: string[],
): Promise<SentenceCheck> {
  const sources = normalize([source, ...otherSources].join('\n'));
  const quotes = sentence.quotes.map(normalize).filter(Boolean);
  if (quotes.length === 0) return { ok: false, reason: 'no quotes' };
  const missing = quotes.find((quote) => !sources.includes(quote));
  if (missing) return { ok: false, reason: `quote not in source: ${missing}` };
  const uncited = uncitedWords(sentence.text, headword, [
    source,
    ...otherSources,
  ]);
  if (uncited.length > 0) {
    return { ok: false, reason: `cites words not in source: ${uncited}` };
  }
  if (hasReconstructedForm(sentence.text)) {
    return { ok: false, reason: 'reconstructed form' };
  }

  const { answers } = await hedged(
    () =>
      jev.systemOne({
        state: { source, otherSources, sentence: sentence.text },
        questions: checks,
      }),
    hedgeAfter,
  );
  const { added, changed } = answers;
  if (added.noul >= failFrom) {
    return { ok: false, reason: `adds to source (${added.noul.toFixed(2)})` };
  }
  if (changed.noul >= failFrom) {
    return { ok: false, reason: `changes source (${changed.noul.toFixed(2)})` };
  }
  return { ok: true };
}
