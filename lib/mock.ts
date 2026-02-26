import { type Article } from '@/lib/model';

const bank: Article = {
  headword: 'bank',
  etymons: [
    {
      lexemes: [
        {
          lexicalCategory: 'noun',
          pronunciation: '/bæŋk/',
          senses: [
            {
              definition:
                'Where you keep your money — a company that manages money for people.',
            },
            { definition: 'A building where people go to do their banking.' },
          ],
        },
        {
          lexicalCategory: 'verb',
          pronunciation: '/bæŋk/',
          senses: [{ definition: 'To keep your money at a bank.' }],
        },
      ],
    },
    {
      lexemes: [
        {
          lexicalCategory: 'noun',
          pronunciation: '/bæŋk/',
          senses: [
            { definition: 'The ground along the edge of a river or stream.' },
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
