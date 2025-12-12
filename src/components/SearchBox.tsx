import { useEffect, useState } from 'react';
import { useCombobox } from 'downshift';
import SuggestionList from './SuggestionList';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { ENTRIES } from '@/data/entries';
import { type SuggestionEntry } from '@/types';

const MAX_SUGGESTIONS = 6;
const DEBOUNCE_MS = 200;
const SIMULATED_NETWORK_MS = 120;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => resolve(), ms);

    const onAbort = () => {
      window.clearTimeout(timeout);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    if (signal.aborted) {
      onAbort();
      return;
    }

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function fetchPrefixSuggestions(
  query: string,
  signal: AbortSignal,
): Promise<SuggestionEntry[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.length === 0) return [];

  await sleep(SIMULATED_NETWORK_MS, signal);

  return ENTRIES.filter((entry) => {
    const term = entry.term.toLowerCase();
    return term.startsWith(normalizedQuery) && term !== normalizedQuery;
  }).slice(0, MAX_SUGGESTIONS);
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
