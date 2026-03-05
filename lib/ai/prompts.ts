import type { Article } from '../schemas';

const bank: Article = {
  headword: 'bank',
  etymons: [
    {
      origin:
        "From Italian banca, 'bench' or 'counter,' the table used by medieval money changers. Reached English via Old French in the 15th century.",
      lexemes: [
        {
          lexicalCategory: 'noun',
          variety: 'American English',
          pronunciation: 'bæŋk',
          senses: [
            {
              definition:
                'A financial institution that holds deposits, issues loans, and handles transactions.',
              example:
                'She stopped at the bank on her lunch break to deposit a check.',
            },
            {
              definition:
                'A store or reserve of something held for future use.',
              example:
                "The hospital's blood bank was running low ahead of the holiday weekend.",
            },
          ],
        },
        {
          lexicalCategory: 'verb',
          variety: 'American English',
          pronunciation: 'bæŋk',
          senses: [
            {
              definition: 'To deposit money in a financial institution.',
              example:
                'He banks his whole paycheck and lives off freelance cash.',
            },
            {
              definition: 'To rely or count on something.',
              example: "Don't bank on the weather holding — bring a jacket.",
            },
          ],
        },
      ],
    },
    {
      origin:
        "From Old Norse bakki, meaning 'ridge' or 'slope.' Extended to the raised ground bordering water and, later, to any banked or tilted surface.",
      lexemes: [
        {
          lexicalCategory: 'noun',
          variety: 'American English',
          pronunciation: 'bæŋk',
          senses: [
            {
              definition:
                'The sloped ground along the edge of a river, lake, or other body of water.',
              example:
                'They spread a blanket on the grassy bank and watched the river go by.',
            },
            {
              definition: 'A raised mass of earth, snow, or cloud.',
              example:
                "A bank of fog drifted in overnight and hadn't lifted by noon.",
            },
          ],
        },
        {
          lexicalCategory: 'verb',
          variety: 'American English',
          pronunciation: 'bæŋk',
          senses: [
            {
              definition:
                'To tilt to one side when turning, as an aircraft or vehicle does.',
              example:
                'The plane banked steeply to the left and lined up with the runway.',
            },
          ],
        },
      ],
    },
  ],
};

const run: Article = {
  headword: 'run',
  etymons: [
    {
      origin:
        "From Old English rinnan and irnan, meaning 'to flow' or 'to move quickly.' Related to Old Norse rinna and German rinnen.",
      lexemes: [
        {
          lexicalCategory: 'verb',
          variety: 'American English',
          pronunciation: 'rʌn',
          senses: [
            {
              definition: 'To move on foot faster than a walk.',
              example:
                'She runs every morning before the rest of the house wakes up.',
            },
            {
              definition: 'To operate or manage something.',
              example:
                "He's been running the family business since his father retired.",
            },
            {
              definition: 'To execute a program or process on a computer.',
              example: 'Run the installer and follow the prompts.',
            },
            {
              definition: 'To seek election to an office.',
              example: 'She announced she would run for governor in the fall.',
            },
          ],
        },
        {
          lexicalCategory: 'noun',
          variety: 'American English',
          pronunciation: 'rʌn',
          senses: [
            {
              definition: 'An act or session of running.',
              example: 'I went for a short run after work to clear my head.',
            },
            {
              definition: 'A continuous stretch or sequence of something.',
              example: 'The team is in the middle of a seven-game winning run.',
            },
            {
              definition: 'A designated route or slope, especially for skiing.',
              example:
                'That run is marked double black diamond — not for beginners.',
            },
          ],
        },
      ],
    },
  ],
};

export const systemPrompt = `
You are writing articles for a well-designed consumer dictionary. Write for a curious general audience, not an academic one. Prioritize the senses people actually encounter, ordered by frequency of everyday use.

## Etymons

An etymon represents a distinct word that entered the language through a separate historical path. Group all lexemes — including extended, figurative, and derived senses — under the same etymon as their source. Only create a new etymon when two words arrived through genuinely unrelated origins (true homographs).

## Output Examples

### bank

${JSON.stringify(bank, null, 2)}

### run

${JSON.stringify(run, null, 2)}
`.trim();
