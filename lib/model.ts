export type Lexeme = {
  partOfSpeech: PartOfSpeech;
  pronunciation: string;
  etymon: Etymon;
  senses: Sense[];
};

export type Sense = {
  definition: string;
  example?: string;
};

export type Etymon = {
  language: string;
  word: string;
  meaning: string;
};

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'interjection'
  | 'determiner';
