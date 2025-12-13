import { useEffect, useState } from 'react';
import { useCombobox } from 'downshift';
import SuggestionList from './SuggestionList';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { type SuggestionEntryWithStatus } from '@/types';

const MAX_SUGGESTIONS = 6;
const SUGGESTION_DEBOUNCE_MS = 700;
const MAX_DEFINITION_CHARS = 58;
const DATAMUSE_ENDPOINT = 'https://api.datamuse.com/words';
const DEFAULT_DEFINITION = 'Definition unavailable';

interface DatamuseResponse {
  word: string;
  defs?: string[];
}

interface WordSuggestion {
  term: string;
  fallbackDefinition: string;
}

function normalizeDefinitionInput(definitionTuple?: string) {
  if (!definitionTuple) return DEFAULT_DEFINITION;
  const [, definition = DEFAULT_DEFINITION] = definitionTuple.split('\t');
  return definition.trim() || DEFAULT_DEFINITION;
}

function clampDefinition(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MAX_DEFINITION_CHARS) return normalized;
  const truncated = normalized.slice(0, MAX_DEFINITION_CHARS - 1).trimEnd();
  return `${truncated}…`;
}

async function fetchWordSuggestions(
  query: string,
  signal: AbortSignal,
): Promise<WordSuggestion[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) return [];

  const url = new URL(DATAMUSE_ENDPOINT);
  url.searchParams.set('sp', `${normalizedQuery}*`);
  url.searchParams.set('md', 'd');
  url.searchParams.set('max', '20');

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error('Failed to load word suggestions');
  }

  const data = (await response.json()) as DatamuseResponse[];
  return data
    .map((entry) => ({
      term: entry.word,
      fallbackDefinition: normalizeDefinitionInput(entry.defs?.[0]),
    }))
    .filter((entry) => entry.term.toLowerCase() !== normalizedQuery)
    .slice(0, MAX_SUGGESTIONS);
}

async function fetchAiDefinitions(
  terms: string[],
  signal: AbortSignal,
): Promise<Record<string, string>> {
  if (terms.length === 0) return {};

  const response = await fetch('/api/define', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ terms }),
    signal,
  });

  if (!response.ok) {
    throw new Error('Failed to load definitions from OpenAI');
  }

  const payload = (await response.json()) as {
    definitions?: Record<string, string>;
  };

  return payload.definitions ?? {};
}

function useLiveSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<SuggestionEntryWithStatus[]>(
    [],
  );

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    setSuggestions([]);

    const timeout = window.setTimeout(async () => {
      try {
        const wordSuggestions = await fetchWordSuggestions(
          trimmedQuery,
          controller.signal,
        );

        if (wordSuggestions.length === 0) {
          setSuggestions([]);
          return;
        }

        const initial = wordSuggestions.map((wordSuggestion) => ({
          term: wordSuggestion.term,
          definition: '',
          definitionStatus: 'loading' as const,
        }));

        setSuggestions(initial);

        let aiDefinitions: Record<string, string> = {};

        try {
          aiDefinitions = await fetchAiDefinitions(
            wordSuggestions.map((wordSuggestion) => wordSuggestion.term),
            controller.signal,
          );
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error(error);
        }

        if (controller.signal.aborted) return;

        setSuggestions((previous) =>
          previous.map((entry) => {
            const aiDefinition = aiDefinitions[entry.term];
            const fallbackDefinition =
              wordSuggestions.find(
                (wordSuggestion) => wordSuggestion.term === entry.term,
              )?.fallbackDefinition ?? DEFAULT_DEFINITION;

            return {
              ...entry,
              definition: clampDefinition(aiDefinition ?? fallbackDefinition),
              definitionStatus: 'ready',
            };
          }),
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(error);
      }
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  return { suggestions };
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
  const { suggestions } = useLiveSuggestions(query);

  const {
    isOpen,
    highlightedIndex,
    getInputProps,
    getMenuProps,
    getItemProps,
  } = useCombobox<SuggestionEntryWithStatus>({
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
    isOpen && query.trim().length > 0 && suggestions.length > 0;

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
