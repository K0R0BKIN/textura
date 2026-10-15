# Bulk generation experiments

One-off scripts behind `docs/bulk-generation.md` (October 2026). They ran from a temporary folder, so paths and inputs need adjusting before rerunning: they expect the Kaikki English dump (`kaikki-English.jsonl`), the prompts in `prompts/` (the prototype's `edit-origin.md`, `edit-senses.md` and `group-senses.md`, from the repo's `prompts/` folder, plus `group-senses-v2.md` here), and `OPENAI_API_KEY` in the environment (`node --env-file=.env.local …`). Python scripts need `wordfreq`; Node scripts need `npm install`.

| Script | Measured |
|---|---|
| `prep.py` | Picks the words Wiktionary has and wordfreq knows, measures their text per frequency band (`stats.json`), and draws a stratified 210-word sample (`sample.jsonl`) |
| `run.mjs`, `analyze.py` | Naive cost: one word per call, normal API, token usage per call, projected to all words |
| `batch.mjs`, `analyze-batch.py` | Optimized cost: words packed per call, trimmed examples, origins with and without quotes, through the real Batch API (`build`, `submit`, `collect`) |
| `group-exp.mjs` | Grouping quality: variants (Luna or Sol, flat or nested input, original or `group-senses-v2.md` prompt) scored 1–5 by a blind judge against Oxford's entry |
| `review.py` | Side-by-side quality review: Wiktionary source, both Luna runs, and Oxford's entry |

`review.py` and `group-exp.mjs` read Oxford entries from local files made with `scripts/lookup-oxford.swift`. Those files contain Oxford's text: keep them out of the repo.
