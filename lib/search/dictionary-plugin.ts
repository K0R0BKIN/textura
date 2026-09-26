import type { AutocompletePlugin } from '@algolia/autocomplete-core';

import {
  isSearchableQuery,
  normalizeSearchQuery,
  type HeadwordRecord,
} from '@/lib/search/headwords';

async function fetchHeadwords(query: string): Promise<HeadwordRecord[]> {
  const response = await fetch(
    `/api/search?q=${encodeURIComponent(normalizeSearchQuery(query))}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to search headwords (${response.status})`);
  }

  return response.json();
}

function createDictionaryPlugin(): AutocompletePlugin<HeadwordRecord> {
  return {
    name: 'textura.dictionaryPlugin',

    getSources({ query }) {
      if (!isSearchableQuery(query)) {
        return [];
      }

      return [
        {
          sourceId: 'dictionary',

          getItemInputValue({ item }) {
            return item.headword;
          },

          getItemUrl({ item }) {
            return item.url;
          },

          getItems() {
            return fetchHeadwords(query);
          },
        },
      ];
    },
  };
}

export { createDictionaryPlugin };
