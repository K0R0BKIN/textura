/**
 * Core data model for Textura dictionary application
 */

/** User's search query with mode detection */
export interface Query {
  text: string;
  mode: 'direct' | 'reverse' | 'fill-in-blanks' | 'contextual' | 'web-search';
  snippet?: string;
}

/** A word entry in a specific language's dictionary */
export interface Headword {
  term: string;
  language: string; // ISO code (e.g., "en")
  summary: string;
  etymons: Etymon[];
  isFavorited?: boolean;
}

/** Words with shared etymology (homograph groups) */
export interface Etymon {
  id: string;
  label: string; // e.g., "bit¹", "bit²"
  origin?: string;
  phonetic?: string; // IPA notation
  audioUrl?: string;
  lexemes: Lexeme[];
}

/** Part-of-speech variant (noun, verb, adjective, etc.) */
export interface Lexeme {
  id: string;
  partOfSpeech: string;
  inflections?: string; // e.g., "plural bits"
  senses: Sense[];
}

/** Distinct meaning of a word */
export interface Sense {
  id: string;
  definition: string;
  tags?: string[]; // informal, nautical, offensive, etc.
  examples?: string[];
  synonyms?: string[];
  antonyms?: string[];
  subSenses?: Sense[];
}

/**
 * UI state types
 */

/** Table of contents state */
export interface TOCState {
  expandedHeadwords: Set<string>;
  selectedLexeme?: string;
}

/** Dictionary/Thesaurus tab state */
export interface TabState {
  current: 'dictionary' | 'thesaurus';
}

/** Right sidebar content */
export interface SidebarContent {
  type: 'snippet' | 'illustration' | null;
  data?: any;
}

/**
 * Free Dictionary API response types
 */

export interface DictionaryAPIPhonetic {
  text: string;
  audio?: string;
}

export interface DictionaryAPIDefinition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryAPIMeaning {
  partOfSpeech: string;
  definitions: DictionaryAPIDefinition[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryAPIResponse {
  word: string;
  phonetic?: string;
  phonetics: DictionaryAPIPhonetic[];
  origin?: string;
  meanings: DictionaryAPIMeaning[];
}
