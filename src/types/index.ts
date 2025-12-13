export interface SuggestionEntry {
  term: string;
  definition: string;
}

export type DefinitionStatus = 'loading' | 'ready';

export interface SuggestionEntryWithStatus extends SuggestionEntry {
  definitionStatus: DefinitionStatus;
}
