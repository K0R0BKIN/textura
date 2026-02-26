export type Article = {
  headword: string;
  etymons: Etymon[];
};

export type Etymon = {
  lexemes: Lexeme[];
};

export type Lexeme = {
  lexicalCategory: LexicalCategory;
  pronunciation: string;
  senses: Sense[];
};

export type Sense = {
  definition: string;
};

export type LexicalCategory = 'noun' | 'verb' | 'adjective' | 'adverb';
