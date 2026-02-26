import { type Article } from '@/lib/model';

const bank: Article = {
  headword: 'bank',
  etymons: [
    {
      lexemes: [
        {
          lexicalCategory: 'noun',
          pronunciation: 'bæŋk',
          senses: [
            {
              definition:
                'A company that holds and lends money — most people use one for savings, payments, and loans.',
            },
            {
              definition: 'The building or office where a bank operates.',
            },
          ],
        },
        {
          lexicalCategory: 'verb',
          pronunciation: 'bæŋk',
          senses: [
            {
              definition: 'To deposit or keep money in a bank.',
            },
          ],
        },
      ],
    },
    {
      lexemes: [
        {
          lexicalCategory: 'noun',
          pronunciation: 'bæŋk',
          senses: [
            {
              definition:
                'The raised ground along the edge of a river or stream.',
            },
          ],
        },
      ],
    },
  ],
};

const articles: Record<string, Article> = { bank };

export function getArticle(headword: string): Article | null {
  return articles[headword] ?? null;
}
