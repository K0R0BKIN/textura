import { useEffect, useState } from 'react';
import { useCombobox } from 'downshift';
import SuggestionList from './SuggestionList';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { type SuggestionEntry } from '@/types';

const MAX_SUGGESTIONS = 6;
const DEBOUNCE_MS = 200;
const DATAMUSE_ENDPOINT = 'https://api.datamuse.com/words';
const DEFAULT_DEFINITION = 'Definition unavailable';

interface DatamuseResponse {
  word: string;
  defs?: string[];
}

interface DictionaryApiDefinition {
  definition: string;
}

interface DictionaryApiMeaning {
  definitions: DictionaryApiDefinition[];
}

interface DictionaryApiEntry {
  meanings: DictionaryApiMeaning[];
}

function extractDefinition(definitionTuple?: string) {
  if (!definitionTuple) return DEFAULT_DEFINITION;
  const [, definition = DEFAULT_DEFINITION] = definitionTuple.split('\t');
  return definition.trim() || DEFAULT_DEFINITION;
}

async function fetchDictionaryApiDefinition(
  word: string,
  signal: AbortSignal,
): Promise<string | null> {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
    word,
  )}`;
  const response = await fetch(url, { signal });

  if (!response.ok) return null;

  const data = (await response.json()) as DictionaryApiEntry[];
  const fallbackDefinition =
    data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition;
  return typeof fallbackDefinition === 'string'
    ? fallbackDefinition.trim() || null
    : null;
}

async function fetchPrefixSuggestions(
  query: string,
  signal: AbortSignal,
): Promise<SuggestionEntry[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) return [];

  const url = new URL(DATAMUSE_ENDPOINT);
  url.searchParams.set('sp', `${normalizedQuery}*`);
  url.searchParams.set('md', 'd');
  url.searchParams.set('max', '20');

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error('Failed to load suggestions');
  }

  const data = (await response.json()) as DatamuseResponse[];

  const suggestions = data
    .map((entry) => ({
      term: entry.word,
      definition: extractDefinition(entry.defs?.[0]),
    }))
    .filter((entry) => entry.term.toLowerCase() !== normalizedQuery)
    .slice(0, MAX_SUGGESTIONS);

  await Promise.all(
    suggestions.map(async (entry) => {
      if (entry.definition !== DEFAULT_DEFINITION) return;

      try {
        const fallbackDefinition = await fetchDictionaryApiDefinition(
          entry.term,
          signal,
        );
        if (fallbackDefinition && !signal.aborted) {
          entry.definition = fallbackDefinition;
        }
      } catch (error) {
        if (signal.aborted) return;
        console.error(error);
      }
    }),
  );

  return suggestions;
}

function useDictionarySuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<SuggestionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    setIsLoading(true);

    const timeout = window.setTimeout(async () => {
      try {
        const nextSuggestions = await fetchPrefixSuggestions(
          trimmedQuery,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setSuggestions(nextSuggestions);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        console.error(error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  return { suggestions, isLoading };
}

interface SearchBarProps {
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  isEmpty: boolean;
}

function SearchBar({ inputProps, isEmpty }: SearchBarProps) {
  const { className, ...restInputProps } = inputProps;

  return (
    <div className="shadow-claude/6 hover:shadow-claude/8 focus-within:shadow-claude/8 flex h-15 w-xs items-center gap-2 rounded-[20px] border border-(--border-5) bg-white p-2 pl-4 shadow-neutral-950 transition-colors focus-within:border-(--border-6) hover:border-(--border-6) sm:w-lg">
      <input
        {...restInputProps}
        className={`text-ui w-full text-black outline-none placeholder:text-(--text-11) ${
          className ?? ''
        }`}
      />
      <button
        type="button"
        className="bg-brown-9 hover:bg-brown-10 btn btn-icon aspect-square h-full rounded-xl text-white"
        disabled={isEmpty}
      >
        <MagnifyingGlassIcon className="icon size-6" />
      </button>
    </div>
  );
}

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const { suggestions, isLoading } = useDictionarySuggestions(query);

  const {
    isOpen,
    highlightedIndex,
    getInputProps,
    getMenuProps,
    getItemProps,
  } = useCombobox<SuggestionEntry>({
    items: suggestions,
    inputValue: query,
    itemToString: (item) => item?.term ?? '',
    onInputValueChange: ({ inputValue }) => {
      setQuery(inputValue ?? '');
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (!selectedItem) return;
      setQuery(selectedItem.term);
    },
    stateReducer: (state, actionAndChanges) => {
      const { type, changes } = actionAndChanges;

      if (
        type === useCombobox.stateChangeTypes.InputKeyDownEnter &&
        state.highlightedIndex < 0
      ) {
        return state;
      }

      if (type === useCombobox.stateChangeTypes.InputChange) {
        const nextInputValue = (changes.inputValue ?? '').trim();
        return { ...state, ...changes, isOpen: nextInputValue.length > 0 };
      }

      if (type === useCombobox.stateChangeTypes.InputBlur) {
        return { ...state, ...changes, isOpen: false, highlightedIndex: -1 };
      }

      return { ...state, ...changes };
    },
  });

  const showSuggestions =
    isOpen && query.trim().length > 0 && suggestions.length > 0 && !isLoading;

  return (
    <div className="relative">
      <SearchBar
        isEmpty={query.trim() === ''}
        inputProps={getInputProps({
          placeholder: 'Look up definitions…',
          autoFocus: true,
        })}
      />

      <SuggestionList
        entries={suggestions}
        highlightedIndex={highlightedIndex ?? -1}
        isOpen={showSuggestions}
        menuProps={getMenuProps({}, { suppressRefError: true })}
        getItemProps={getItemProps}
      />
    </div>
  );
}
