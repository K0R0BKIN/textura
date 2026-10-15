# Rewriting English Wiktionary with Luna: cost and quality

Measured on 2026-10-12 and 13, for the decision to generate the dictionary in bulk rather than on first view. The scripts and raw outputs lived in a temporary folder and aren't preserved; the method notes describe how to repeat each measurement.

## 1. Cost

**Method.** 210 words drawn at random, 35 from each of six frequency bands. Rewritten with gpt-6-luna (no reasoning) using the prototype's three prompts: origins, senses, grouping (parts of speech with 6+ senses). The optimized run went through the real Batch API; token counts are OpenAI's own usage figures. Each call's tokens were attributed to its words by input size, then scaled to the full word list by band.

**Prices (gpt-6-luna, per 1M tokens):** standard $0.10 input / $0.01 cached / $0.50 output; batch $0.05 / $0.005 / $0.25.

| Run | Calls for 210 words | Input (projected) | Output (projected) | Cost for 216K words |
|---|---|---|---|---|
| Naive: one word per call, normal API | 412 | 428M | 20M | $32–53 (batch-priced: $16–26) |
| **Optimized: real Batch API, words packed per call, 1 short example per sense** | 106 | 79M | 19M | **$7.6** |
| Same, origins without quotes | 106 | 78M | 16M | **$6.9** |

**What did the work:**
- **Packing several words per call** cut input 5× (428M → 79M): the instructions were 95% of input and are now shared. Published technique: *Batch Prompting*, Cheng et al., EMNLP 2023 (up to ~5× fewer tokens with ~6 items per call, accuracy comparable).
- **Batch API:** 50% off, results within 24 h ([docs](https://developers.openai.com/api/docs/guides/batch)).
- **Prompt caching works inside the Batch API**, measured: 63–68% of origin-call input was cached. Senses and grouping got 0%: their prompts are under the 1,024-token minimum ([docs](https://developers.openai.com/api/docs/guides/prompt-caching)).
- **Dropping the origin quotes** (57% of origin output; they exist only so code can check each sentence) saves ~$0.7.

**What didn't help:** letting code write simple origins ("From *un-* + *opened*"): only 3% of origins in this vocabulary are that simple.

**Where the floor is.** Output (~16–19M tokens ≈ $4–5) is now most of the cost, and it can't go much lower: rewriting means writing the text. Remaining input is ~$3.

**Reliability:** 106/106 requests completed; every sense ID came back; 3 responses (2.8%) had malformed JSON (the model kept writing after closing the object) and would need a retry: about +3%.

**Lowest workable cost, with a margin:**

| Scope | Estimate |
|---|---|
| 216K used words | **~$8** (with retries) |
| Same minus 65K proper-name-only entries | **~$7** |
| All of English Wiktionary (1.39M headwords incl. phrases; ~2.5× the text) | **~$20** (extrapolated from text size, not sampled) |
| Regenerating after a prompt change | the same again |

## 2. Quality

**Method.** 18 words across all bands (*line, keep, low, finger, career, breathe, pill, cant, clique, narcissism, peremptory, gammon, beamish, confidante, freesia, asbestosis, incertitude, cerclage*), about 330 senses, read side by side: Wiktionary's source, Luna (naive run), Luna (optimized batch), and Oxford (New Oxford American Dictionary, from the Mac Dictionary app). Merriam-Webster blocks automated access with a bot check, so it isn't included.

**Faithfulness to Wiktionary: very good.** Rewrites are careful copy-edits: Oxford's format (lowercase, no final period, semicolons, "(in geometry)"), nothing invented. I found about 4 slips in ~330 senses (~1%), e.g. *low* "Compare vulgar" turned into the synonym "vulgar"; *clique* lost "(1912–1949)"; *keep* "(with from)" became a confusing "(keep someone from something)". Packing several words per call did not visibly hurt quality.

**Origins: good, close to Oxford's length and form.** The no-quotes variant often kept more (e.g. *line*: Middle French influence, link to *linen*) and read better; both sometimes left out Dutch/German relatives Oxford gives (*low*: Dutch *laag*).

**Compared with Oxford, the gap is the content, not the rewriting:**
- **Rare words** (*cerclage, beamish, incertitude, asbestosis, freesia*): about as good as Oxford, sometimes thinner (Oxford adds the plant family and description for *freesia*).
- **Common words**: they read like a tidier Wiktionary, not like Oxford. *line* has 55 noun senses in Wiktionary (perfusion sets, a tsarist unit, the maxwell) against Oxford's six groups; *keep* has 27 flat verb senses. Oxford's definitions are also more general and come with short examples.
- **Grouping** produces more core senses than Oxford (*line* noun 15 vs 6; *keep* verb 10 vs 5). Section 6 shows that counting cores was the wrong yardstick: judged against Oxford's structure, Luna groups as well as Sol.

## 3. 200K or all of Wiktionary

**Method.** Every English Wiktionary page view in August 2026 (Wikimedia's complete monthly dump, human traffic only), matched to Wiktionary's 1.39M English headwords: 30.3M views.

| Word set | Share of views |
|---|---|
| Our 216K (single words wordfreq knows) | 60% |
| 151K core words (216K minus 65K name-only entries) | 54% |
| Core words + the 129K phrases listed under them | 66% |
| **Single words wordfreq doesn't know** | **24%** |

The quarter of lookups outside frequency lists goes to rare, new and slang words: *kirkification, anemoia, footgun, shiesty, bidialectal, incelosphere*. Caveats: a Wiktionary page covers all languages, and Wiktionary's readers skew toward word enthusiasts. Still, 99.9% coverage at 200K doesn't hold.

Rather than a frequency list, the word list should come from real lookups (section 7).

## 4. Tasks and models

| Task | Needs the whole word? | Done by | Measured |
|---|---|---|---|
| Pronunciation, word forms, labels, examples | No | **Code** | Data is structured |
| Synonyms, antonyms, derived words, phrase and phrasal-verb lists | No | **Code** | Data is structured |
| Rewrite definitions (incl. phrases') | No | **Luna** | ~1% slips |
| Rewrite origins | No (one word's etymologies) | **Luna** | Good |
| Order etymologies, order parts of speech | Yes | **Jev** (or Wiktionary's own order) | Untested; Jev is $0.042/M input, output free (third-party reports of TypeSafe's launch pricing) |
| **Group senses** | Yes (one part of speech) | **Luna, no reasoning** | Tied with Sol (see 6); retry when it returns no structure |

**Granularity.** In a bulk run the reveal order no longer matters, but separate tasks are still the better design: each task gets its own model, its own prompt to iterate on, and packing across words makes isolated tasks cheap. Merging grouping into rewriting would save only the grouping input (~10% of tokens) while forcing the expensive model onto all rewriting. Batch also allows real stages, e.g. grouping first and rewriting with the group as context, if that improves definitions.

## 5. What Wiktionary has vs. what Oxford (Mac Dictionary) shows

Coverage over the 151K core words.

| Oxford / Mac Dictionary shows | In Wiktionary | Coverage | Cost to include |
|---|---|---|---|
| Pronunciation | IPA, US/UK | 34% of words (most forms like *cats* lack it) | Code |
| Inflections (*kept*) | `forms` | 61% | Code |
| Labels (*informal, British, Baseball*) | sense tags | 88% | Code |
| Senses, subsenses | `senses` | all | Luna (above) |
| Examples | sense `examples` | 44% | Code (pick) |
| Phrases (*keep one's feet*) | multiword entries listed under the word | 22K idioms | ~$0.40 |
| Phrasal verbs (*keep up*) | same | 4K | ~$0.10 |
| Derivatives (*lowness*) | `derived`, single words | 192K terms | Code |
| Origin | `etymology_text` + structured templates | 50% have templates | Luna |
| Thesaurus (separate in the Mac app) | sense-level synonyms | 354K terms, 19% of words; antonyms 23K | Code |
| — | Compound nouns (*false friend*) | 104K entries | ~$1.80 if rewritten |
| — | Translations, descendants, hypernyms | small | Skip |

## 6. Grouping: Luna is enough

**Method.** 70 random parts of speech with 6+ senses from common words, grouped five ways, each scored 1–5 by a blind judge (gpt-6-sol, medium reasoning) against Oxford's entry for the word.

| Variant | Mean score | Mean cores | Cost, all 11,279 grouped parts of speech |
|---|---|---|---|
| Luna, original prompt | 3.87 | 5.1 | $0.56 |
| Luna, original prompt, Wiktionary nesting kept | 3.83 | 5.0 | $0.56 |
| Luna, prompt pushing for fewer cores | 3.59 | 3.7 | $0.79 |
| Sol, original prompt | 3.89 | 3.6 | $10.55 |
| Sol, prompt pushing for fewer cores | 3.67 | 2.9 | $15.45 |

Luna vs Sol, paired: −0.01 ± 0.22 (95% CI); each better on 18, tie on 34. The earlier "2.5× too many cores" was the wrong yardstick: pushing for fewer cores made both models worse. Luna's one failure mode is returning no structure (*wallet*): detectable in code, retry or fall back to Sol.

**Cheaper tools can't group.** Jev and OpenAI's Decisions API ($0.10/M input, output free) answer fixed questions: yes/no, one of given options, a score. Grouping needs two dependent steps (pick the cores, then assign every other sense), which the Decisions API docs say needs separate requests: about $2 for all 11,279, more than Luna's $0.56. The Decisions API also isn't listed for the Batch API.

## 7. How much of Wiktionary matters (August 2026 page views)

| Top N words by lookups | Share of lookups | Share of text | Cost to generate |
|---|---|---|---|
| 28K | 50% | 19% | ~$4 |
| 100K | 72% | 36% | ~$7 |
| 176K | 80% | 47% | ~$9 |
| 400K | 90% | 69% | ~$13 |
| 625K | 95% | 82% | ~$15 |
| all 1.39M | 100% | 100% | ~$19 |

Ranking by real lookups is a better word list than wordfreq: it drops unlooked-up names and keeps new words.

## 8. Further optimizations

Priced for a full run of all of English Wiktionary, starting from the optimized batch run as measured (**$17.9**; grouping priced separately at $0.81, since it depends on the number of big entries, not on text size).

| Optimization | What it changes | Quality | Saves | Use? |
|---|---|---|---|---|
| Origins without quotes | The model stops copying the source passage behind each sentence; spot-check a sample instead | Text read better without them; loses the automatic per-sentence check | $1.6 (measured) | ✅ |
| Compact JSON | Short IDs and keys: 37% of senses output is scaffolding | None expected; code checks IDs | ~$1.4 (estimated) | ✅ |
| Cache the senses prompt | Add worked examples so the prompt passes the 1,024-token caching minimum | Neutral to positive | ~$1.4 (estimated) | ✅ |
| Code formats "clean" senses | Skip Luna for senses that only need lowercasing (18% of senses) | Risky: can't tell in advance which need rewording | ~$0.7 | ❌ |

With the three adopted: **~$13.4 for all of English Wiktionary** (±20%, two savings are estimates). The floor is Luna writing the definitions and origins.

| Top N words by lookups | Share of lookups | Optimized cost | Cost per extra % of lookups |
|---|---|---|---|
| 28K | 50% | $2.7 | $0.05 |
| 100K | 72% | $5.0 | $0.10 |
| 176K | 80% | $6.6 | $0.20 |
| 400K | 90% | $9.5 | $0.29 |
| all 1.39M | 100% | $13.4 | $0.39 |

## Recommendation

- **Generate in bulk, serve static files.** Pre-generation is instant, works offline, and costs nothing per view; on-demand generation would bring back the complex streaming pipeline.
- **Iterate on the test words or the top 28K** (~$3 per run), not the full set.
- **Ship the top 400K** by real lookups: 90% of lookups for ~$10 per run.
- **Add the long tail later** if wanted: ~$4.
- **Store results with a fingerprint** of input, prompt and model, so reruns only regenerate what changed.

## Verdict

Luna does the rewriting job well enough. What separates the result from Oxford is what Wiktionary contains and how it's organized: which senses to show, how to group them, how much to condense. Those are product decisions, not a model problem.
