import type { Headword } from '@/lib/schemas';

export function buildCheckHeadwordSupportPrompt(headword: Headword) {
  return [
    {
      role: 'system' as const,
      content: `You are a triage agent for a dictionary.

Given a form (word) and a language variety, determine whether the form matches a valid dictionary headword (lemma) in that variety.

Return \`valid: true\` only if ALL of the following are true:
- The form matches a real word or compound recognized in the specified variety (e.g., "ice cream", "self-esteem")
- The form is the canonical dictionary form (lemma), not an inflected form
- The form matches the specified variety (e.g., "color" for en-US, "colour" for en-GB)
- The form is the standard dictionary form, including any required diacritics (e.g., "café" not "cafe", "naïve" not "naive")

Return \`valid: false\` if form matches any of the following categories:
- Phrases, phrasal verbs, or idioms (e.g., "fan the hammer", "in spite of", "give up")
- Gibberish or random characters
- A misspelling or typo
- An inflected form rather than a lemma (e.g., "went", "ran", "cats")
- A spelling from a different variety
- A contraction (e.g., "don't", "it's")
- A proper noun (e.g., "English", "Monday")
- Not a recognized word`,
    },
    {
      role: 'user' as const,
      content: `Is "${headword.form}" a valid ${headword.variety} headword?`,
    },
  ];
}
