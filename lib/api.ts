/**
 * Dictionary API client
 * Fetches from Free Dictionary API and transforms to internal types
 */

import type {
  DictionaryAPIResponse,
  Headword,
  Etymon,
  Lexeme,
  Sense,
} from './types';

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

/**
 * Fetch word definition from Dictionary API
 * @throws {NotFoundError} if word not found (404)
 * @throws {Error} for other errors
 */
export async function fetchWordDefinition(
  query: string
): Promise<Headword | null> {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return null;

  try {
    const response = await fetch(`${API_BASE}/${normalizedQuery}`);

    if (!response.ok) {
      if (response.status === 404) {
        const error = new Error(`Word "${query}" not found`);
        error.name = 'NotFoundError';
        throw error;
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data: DictionaryAPIResponse[] = await response.json();
    if (!data || data.length === 0) return null;

    return transformAPIResponse(data[0], normalizedQuery);
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      throw error;
    }
    console.error('Dictionary API fetch error:', error);
    throw new Error('Failed to fetch word definition');
  }
}

/**
 * Transform API response to internal Headword type
 * Note: API doesn't separate etymons properly - we treat entire response as single etymon for Phase 1
 */
function transformAPIResponse(
  data: DictionaryAPIResponse,
  query: string
): Headword {
  // Find best audio URL
  const audioUrl =
    data.phonetics.find((p) => p.audio)?.audio || undefined;

  // Create single etymon from all meanings
  const etymon: Etymon = {
    id: `${query}-1`,
    label: `${data.word}¹`,
    origin: data.origin,
    phonetic: data.phonetic || data.phonetics[0]?.text,
    audioUrl,
    lexemes: data.meanings.map((meaning, idx) =>
      transformMeaning(meaning, `${query}-1-${idx}`)
    ),
  };

  // Create headword
  const headword: Headword = {
    term: data.word,
    language: 'en',
    summary: generateSummary(data),
    etymons: [etymon],
  };

  return headword;
}

/**
 * Transform API meaning to internal Lexeme
 */
function transformMeaning(
  meaning: DictionaryAPIResponse['meanings'][0],
  baseId: string
): Lexeme {
  const senses: Sense[] = meaning.definitions.map((def, idx) => ({
    id: `${baseId}-${idx}`,
    definition: def.definition,
    examples: def.example ? [def.example] : undefined,
    synonyms: [
      ...new Set([...def.synonyms, ...meaning.synonyms]),
    ].filter(Boolean),
    antonyms: [
      ...new Set([...def.antonyms, ...meaning.antonyms]),
    ].filter(Boolean),
  }));

  return {
    id: baseId,
    partOfSpeech: meaning.partOfSpeech,
    senses,
  };
}

/**
 * Generate summary text for headword
 */
function generateSummary(data: DictionaryAPIResponse): string {
  const partsOfSpeech = data.meanings
    .map((m) => m.partOfSpeech)
    .join(', ');
  return partsOfSpeech;
}
