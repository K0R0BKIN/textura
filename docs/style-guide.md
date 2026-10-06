# Textura style guide

Textura rewrites Wiktionary in the style of Oxford's main dictionary, the _New Oxford American Dictionary_ (NOAD, the dictionary in macOS). The rule is: **do what Oxford does, unless this guide lists a deliberate exception.** Each rule names its source.

Sources: NOAD entries for the 31 origin test words (looked up with `scripts/lookup-oxford.swift`), NOAD's introduction on core senses and subsenses, and Merriam-Webster's explanatory notes on etymologies. Examples below are Textura's own, written from Wiktionary.

## Deliberate exceptions

| Oxford                                             | Textura                                                           | Why                                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Origin at the end of the entry                     | Origin at the top                                                 | Textura leans on etymology; reading the origin first helps the reader remember the word |
| Facts from Oxford's own research                   | Facts only from Wiktionary                                        | Every statement must be traceable to the source                                         |
| Every origin opens with a date                     | A date only when Wiktionary gives one                             | Wiktionary rarely does: about 3% of its etymologies                                     |
| Examples written or chosen by editors              | Wiktionary's examples, word for word                              | Examples are never generated                                                            |
| A curated, shorter list of senses                  | All of Wiktionary's senses; the less important behind "Show more" | Nothing is lost, but the entry starts as short as Oxford's                              |
| Labels (_informal_, _Chess_), phrases, derivatives | Not yet                                                           | Deferred; Wiktionary has the data                                                       |

## Origins

An origin is a short **line** (where the word came from) and, only when the source has one, a **story** (one or two sentences about how it got its meaning).

### The line

1. **Terse, not sentences.** A chain of fragments joined by commas and semicolons: "From Old French _salaire_, from Latin _salārium_ ‘wages’, from _sal_ ‘salt’." _(Oxford)_
2. **Start from where English got the word.** For a native word, its Old English form: "Old English _docga_, of uncertain origin." For a borrowing: "From Dutch _koffie_, ultimately from Arabic _qahwa_." Skip English intermediate forms, such as the Middle English spelling between Old English and today. _(Oxford; Merriam-Webster's "ultimately from")_
3. **First meaning in parentheses**, when the source gives an earlier English sense: "Middle English (in the sense ‘foolish’): from Old French _nice_, from Latin _nescius_ ‘ignorant’." _(Oxford)_
4. **A language the word only passed through** gets "via", without its form: "probably via Dutch". _(Oxford)_
5. **Native Germanic words:** "of Germanic origin; related to Dutch _hoofd_ and German _Haupt_", naming at most Dutch and German. _(Oxford)_
6. **Deeper roots without reconstructed forms:** "from an Indo-European root shared by Latin _verbum_ ‘word’". Never a starred form or a proto-language name. _(Oxford: no starred forms in any of the 31 entries)_
7. **English relatives** the source names: "related to _bench_", "also to _sit_". _(Oxford)_
8. **Simple formations** stay simple: "From _un-_ + _opened_." _(Oxford)_
9. **Another etymology of the same word** is referred to, not repeated: "From the noun." _(Oxford, "see …")_

### The story

10. **Only when the source has one:** how the meaning shifted, a literal meaning, a word it replaced, who coined it or what it was named after. One or two plain sentences after the line. Most origins have no story. _(Oxford: 5 of the 31 test entries)_

### Throughout

11. **Uncertainty in words, as strong as the source's:** _probably_, _perhaps_, _apparently_, "of uncertain origin", "origin unknown". _(Oxford, Merriam-Webster)_
12. **Italics** for cited forms and titles of works; **meanings in single curly quotes** right after the form: _sal_ ‘salt’. _(Oxford, Merriam-Webster)_
13. **Only what the source says.** Leave out, never add. _(Textura)_

## Senses

### Structure

14. **Core senses and subsenses.** Each part of speech has a few numbered core senses, each with subsenses under it. A core sense is the most literal, central meaning in modern use, not necessarily the oldest or the most frequent. A subsense is a figurative extension of its core, a special case of it, or another shift that keeps part of its meaning. _(NOAD introduction)_
15. **Most important first.** Core senses are ordered by how central they are today. _(NOAD)_

### Definitions

16. **A phrase, not a sentence:** lowercase, no final period. _(Oxford)_
17. **Substitutable:** the definition can stand in for the word. Verbs as bare verb phrases with the object in parentheses: "put (money) into a bank". Nouns as noun phrases: "a hot drink made from the roasted seeds of a tropical shrub". _(Oxford)_
18. **Near-synonyms separated by semicolons:** "foolish; lacking good sense". _(Oxford)_
19. **Context in parentheses** at the start: "(of food) no longer fit to eat". _(Oxford)_
20. **A usage pattern** goes before its definition: "(look something up) search for information about something in a reference work". _(Oxford)_
21. **Pointer senses** stay pointers: "short for _laboratory_", "misspelling of _googol_". _(Oxford)_
22. **Plain, precise wording**, American spelling. _(Oxford, Textura)_
