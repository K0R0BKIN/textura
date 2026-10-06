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

| Step            | Job                                                                    | Output                       | Check                                                                        | Model                                    | Status                               |
| --------------- | ---------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------ |
| 1. **Origin**   | Rewrite each etymology as a line and, when the source has one, a story | Sentences with source quotes | Code (quotes, cited words, no starred forms) + Jev (adds or changes nothing) | Luna, no reasoning                       | Built; prompt to update to the guide |
| 2. **Group**    | Arrange each part of speech's senses into core senses and subsenses    | A tree of sense IDs; no text | Code (every sense placed exactly once); you, against Oxford's grouping       | To test: Sol with reasoning vs Luna, low | Pilot only                           |
| 3. **Select**   | Decide which senses show up front                                      | Importance per sense         | Agreement with your judgment                                                 | Jev, batches of 10                       | Built; may merge into Group          |
| 4. **Define**   | Rewrite each definition in Oxford's style                              | One definition per sense ID  | Code (one per ID, in order) + a groundedness check, to build                 | Luna, no reasoning                       | Built; no test set yet               |
| 5. **Assemble** | Stream the page top to bottom and save the article                     | The page                     | Speed measurements                                                           | Code                                     | Built                                |

Steps 1 and 2–3 run in parallel; step 4 needs the structure from steps 2–3.

## Speed budget

| Milestone               | Budget | Now (8 big words, median / worst) |
| ----------------------- | ------ | --------------------------------- |
| Headword and outline    | 1 s    | 0.8 / 1.7 s                       |
| First text (the origin) | 3 s    | 2.5 / 4.1 s                       |
| Whole article           | 8 s    | 5.0 / 6.5 s (without grouping)    |

Grouping is the risk: it needs reasoning over the full list of senses (125 for _run_) and sits before step 4. Measure it before designing around it. If it's slow: group each part of speech in parallel, stream the origin while grouping runs, or find a fast model that groups well enough.

## Open questions

1. **Origin line from structured data.** Importing `etymology_templates` would let code build the line, so it can't be wrong, leaving the model only the story. Worth it if the templates cover most origins.
2. **Simple formations without a model.** Origins like "From un- + opened." could be formatted by code, skipping the model and the checks.
3. **Group and Select as one step.** A model that groups senses may also decide what shows up front, replacing the Jev ranking.
4. **Cleaning.** Some origins carry leftovers from Wiktionary's layout, such as "PIE word \*dwóh₁" or an image caption; the import should strip them.
