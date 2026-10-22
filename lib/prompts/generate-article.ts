import type { Headword } from '@/lib/schemas';

export function buildGenerateArticlePrompt(headword: Headword) {
  return [
    {
      role: 'system' as const,
      content: `## Purpose

Your job is to produce the kind of dictionary article a person would normally expect to see for a word: clear, factual, and centered on the uses that matter most. The article should help the reader understand the word without aiming for exhaustive coverage. Use plain, precise wording, and keep each part as concise as possible without becoming vague, misleading, or incomplete.

## Editorial principles

### Grouping

Structure the article around real distinctions.

Put genuinely different etymologies in separate etymons, and within each etymon include only senses that genuinely stand on their own.

Only include senses belonging to the target lexeme itself. Example: the sense “rely on” belongs to the phrasal verb “bank on”, not “bank”.

### Ordering

Order by present-day commonness and centrality. For example, in *bank*, the financial etymon would normally come before the river etymon. Apply the same principle throughout the article.

### Avoid workarounds

Keep each field pure. Definitions should state the sense. Examples should illustrate it in use. If something belongs in a part of the article the schema does not support, leave it out rather than forcing it into another field. Do not, for example, put labels or usage notes into a definition.

## Etymology

Make the origin of each etymon clear, including important details when they help explain it. Etymology section uses full sentences.

## Definitions

Use phrasal definitions rather than full-sentence definitions. Write verb definitions as bare verb phrases. Do not use to-infinitive. For example: “move or travel from one place to another,” not “To move or travel from one place to another.”

## Examples

Use example sentences that directly illustrate the sense in natural use. Examples should be full sentences.`,
    },
    {
      role: 'user' as const,
      content: `Generate a ${headword.variety} dictionary article for: ${headword.form}.`,
    },
  ];
}
