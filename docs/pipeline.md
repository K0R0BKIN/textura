# Editing pipeline

How a Wiktionary article becomes a Textura article, step by step. The goal is simple: rewrite Wiktionary the way Oxford would ([style guide](style-guide.md)). The pipeline is a fixed chain of steps (a workflow, not an agent), and each step:

- does **one job** with a narrow input and output,
- has **its own test** with a pass mark,
- uses the **cheapest model that passes** that test: first make it right with the strongest model, then try smaller and faster ones,
- has a **latency budget**, since articles are edited on first view.

References: Anthropic, [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) (prompt chaining with checks between steps; add complexity only when tests show it helps); OpenAI, [Model selection](https://platform.openai.com/docs/guides/model-selection) (accuracy first, then cost and latency).

## The data

- 883K headwords. Most are rare, which is what the dictionary is mostly used for.
- Fewer than half of etymologies have an origin. The median origin is 25 characters, typically a formation like "From un- + opened."; 90% are under 130 characters. Long origin stories are concentrated in common words.
- About 3% of origins give a date; 5% name an Old, Middle or Early Modern English stage (54% in the common test words).
- The structured etymology data (`etymology_templates`: inherited, borrowed, derived) is in the Kaikki dump but not imported.
- Senses are mostly flat: _set_ has 97 senses, none nested; Oxford groups its senses under 9 core senses.

## Steps

| Step            | Job                                                                    | Output                       | Check                                                                            | Model              | Status                                          |
| --------------- | ---------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------- |
| 0. **Import**   | Wiktionary's senses, labels, origins, and phrases                      | Articles and a phrases table | Code                                                                             | None               | Built; labels and phrases need a full re-import |
| 1. **Origin**   | Rewrite each etymology as a line and, when the source has one, a story | Sentences with source quotes | Code (quotes, cited words, no starred forms) + Jev (adds or changes nothing)     | Luna, no reasoning | Built; `scripts/eval-origins.mts`               |
| 2. **Group**    | Arrange parts of speech with 6+ senses into core senses and subsenses  | Core senses, streamed        | Code (every sense placed exactly once); compared with Oxford by hand             | Sol, no reasoning  | Built                                           |
| 3. **Define**   | Rewrite each definition in Oxford's style, keeping all its information | One definition per sense ID  | Code (one per ID, in order; repeated labels stripped); `scripts/eval-senses.mts` | Luna, no reasoning | Built                                           |
| 4. **Assemble** | Stream the page top to bottom and save the article                     | The page                     | Speed measurements (`scripts/time-articles.mts`)                                 | Code               | Built                                           |

Every sense is shown; labels (_informal_, _obsolete_, _chess_) come straight from Wiktionary, and phrases and phrasal verbs are links at the end. Steps 1–3 all start at once: definitions are rewritten while grouping runs, and each core sense is shown as soon as it arrives.

## Speed

| Milestone               | Budget | Measured                    |
| ----------------------- | ------ | --------------------------- |
| Headword                | 1 s    | instant                     |
| First text (the origin) | 3 s    | about 2–3 s (sometimes 5 s) |
| First sense, big words  | 4 s    | 2.2–3.6 s                   |
| Whole article           | 8 s    | 3–7.5 s                     |

## Quality

- **Origins:** 53 of 61 clean on the test set, 0 added facts; failing sentences are dropped.
- **Definitions:** on 1,415 definitions, about 0.3% add or change meaning (read by hand; Jev flags many faithful rewordings, so it's a pointer, not a gate).
- **Grouping:** close to Oxford on the main core senses; some unrelated senses still land under a big core.

## Open questions

1. **Origin line from structured data.** Importing `etymology_templates` would let code build the line, so it can't be wrong, leaving the model only the story. Worth it if the templates cover most origins.
2. **Simple formations without a model.** Origins like "From un- + opened." could be formatted by code, skipping the model and the checks.
3. **Cleaning.** Some origins carry leftovers from Wiktionary's layout, such as "PIE word \*dwóh₁" or an image caption; the import should strip them.
4. **Grouping quality.** Sol with low reasoning keeps unrelated senses apart a little better, but takes 4–10 s.
