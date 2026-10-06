// Phrases and phrasal verbs listed at the end of an article, as Oxford does:
// "keep one's cool" and "cool it" under "cool", and "cool down" under the verb
// "cool" only. Each is a Wiktionary entry of its own, linked from the words it
// contains.

export type PhraseKind = 'phrase' | 'phrasal verb';

const particles = new Set(
  [
    ...['up', 'down', 'off', 'out', 'in', 'on', 'over', 'away', 'back'],
    ...['through', 'about', 'around', 'round', 'along', 'by', 'for', 'with'],
    ...['into', 'onto', 'at', 'to', 'after', 'across', 'apart', 'aside'],
    ...['ahead', 'forward', 'together', 'under', 'upon', 'from', 'of'],
  ].map((word) => word.toLowerCase()),
);

// Words a phrase isn't listed under: placeholders and function words.
const minorWords = new Set([
  ...['a', 'an', 'the', 'and', 'or', 'but', 'not', 'no', 'as', 'than'],
  ...['be', 'is', 'are', 'it', 'its', "it's", 'that', 'this', 'what'],
  ...['one', "one's", 'oneself', 'someone', "someone's", 'somebody'],
  ...["somebody's", 'something', 'somewhere', 'anyone', 'anything'],
  ...['you', 'your', 'yourself', 'i', 'me', 'my', 'he', 'his', 'him'],
  ...['she', 'her', 'we', 'us', 'our', 'they', 'them', 'their', 'all'],
  ...['x', 'y', 'so', 'if', 'too', 'very', 'like'],
]);

// Wiktionary parts of speech whose multiword entries are phrases. Multiword
// nouns are mostly compounds ("coffee table"), which Oxford lists as entries
// of their own.
const phraseCategories = new Set([
  'phrase',
  'prep_phrase',
  'proverb',
  'verb',
  'adj',
  'adv',
  'intj',
]);

// The words a multiword entry is listed under, and as what.
export function phraseLinks(
  phrase: string,
  partsOfSpeech: string[],
): { headword: string; kind: PhraseKind }[] {
  const words = phrase
    .split(' ')
    .map((word) => word.replace(/^[^\p{L}]+|[^\p{L}']+$/gu, ''))
    .filter(Boolean);
  if (words.length < 2) return [];

  const [first, ...rest] = words;
  if (
    partsOfSpeech.includes('verb') &&
    rest.every((word) => particles.has(word.toLowerCase()))
  ) {
    return [{ headword: first, kind: 'phrasal verb' }];
  }
  if (!partsOfSpeech.some((pos) => phraseCategories.has(pos))) return [];

  const keywords = words.filter(
    (word) =>
      !minorWords.has(word.toLowerCase()) && !particles.has(word.toLowerCase()),
  );
  return [...new Set(keywords)].map((headword) => ({
    headword,
    kind: 'phrase' as const,
  }));
}
