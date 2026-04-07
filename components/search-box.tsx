'use client';

import {
  createContext,
  useEffect,
  use,
  useCallback,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useHotkey, formatForDisplay } from '@tanstack/react-hotkeys';
import { Toast } from '@base-ui/react/toast';
import {
  AnimatePresence,
  motion,
  type HTMLMotionProps,
  useReducedMotion,
} from 'motion/react';
import { Search, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Kbd } from '@/components/ui/kbd';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';
import { dictionaryPath } from '@/lib/dictionary/routes';
import { getTRPCClient } from '@/trpc/client';

const toastManager = Toast.createToastManager();

function SearchBoxToasts({
  side,
}: {
  side: Extract<Toast.Positioner.Props['side'], 'top' | 'bottom'>;
}) {
  const {
    state: { invalid },
    meta: { groupRef },
  } = useSearchBoxContext();
  const { toasts } = Toast.useToastManager();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!invalid) return;

    const id = toastManager.add({
      type: 'error',
      description: 'This query looks invalid',
      positionerProps: {
        anchor: groupRef.current,
        side,
        sideOffset: 8,
        align: 'start',
        alignOffset: 4,
      },
    });

    return () => toastManager.close(id);
  }, [groupRef, invalid, side]);

  return (
    <Toast.Portal>
      <Toast.Viewport>
        <AnimatePresence>
          {toasts.map((toast) => {
            const offset = reduceMotion ? 0 : side === 'top' ? 6 : -6;
            const exitOffset = reduceMotion ? 0 : side === 'top' ? 2 : -2;
            const transformOrigin = side === 'top' ? 'left bottom' : 'left top';

            return (
              <Toast.Positioner key={toast.id} toast={toast}>
                <Toast.Root
                  toast={toast}
                  render={(props) => (
                    <motion.div
                      {...(props as HTMLMotionProps<'div'>)}
                      style={{ transformOrigin }}
                      initial={{
                        opacity: 0,
                        y: offset,
                        scale: reduceMotion ? 1 : 0.985,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: reduceMotion
                          ? {
                              duration: 0.18,
                              ease: [0.32, 0.72, 0, 1],
                            }
                          : {
                              y: {
                                type: 'spring',
                                visualDuration: 0.18,
                                bounce: 0.12,
                              },
                              scale: {
                                type: 'spring',
                                visualDuration: 0.18,
                                bounce: 0.08,
                              },
                              opacity: {
                                duration: 0.14,
                                ease: [0.32, 0.72, 0, 1],
                              },
                            },
                      }}
                      exit={{
                        opacity: 0,
                        y: exitOffset,
                        transition: {
                          duration: 0.12,
                          ease: [0.4, 0, 1, 1],
                        },
                      }}
                    />
                  )}
                >
                  <Toast.Content className="inline-flex items-center gap-1 rounded-lg border bg-card py-1.5 pr-2.5 pl-1.5 text-xs font-normal text-foreground shadow-xs">
                    <X className="size-3 shrink-0 text-destructive" />
                    <Toast.Description />
                  </Toast.Content>
                </Toast.Root>
              </Toast.Positioner>
            );
          })}
        </AnimatePresence>
      </Toast.Viewport>
    </Toast.Portal>
  );
}

type SearchBoxState = {
  query: string;
  status: 'idle' | 'validating' | 'invalid' | 'navigating';
  invalidFor: string | null;
};

type SearchBoxContextValue = {
  state: {
    query: string;
    busy: boolean;
    invalid: boolean;
  };
  actions: {
    setQuery: (query: string) => void;
    submit: () => Promise<void>;
    reset: () => void;
  };
  meta: {
    inputRef: React.RefObject<HTMLInputElement | null>;
    groupRef: React.RefObject<HTMLDivElement | null>;
  };
};

type SearchBoxAction =
  | { type: 'queryChanged'; query: string }
  | { type: 'submitted' }
  | { type: 'validationFailed'; query: string }
  | { type: 'navigationStarted' }
  | { type: 'validationErrored' }
  | { type: 'reset' };

const initialSearchBoxState: SearchBoxState = {
  query: '',
  status: 'idle',
  invalidFor: null,
};

const SearchBoxContext = createContext<SearchBoxContextValue | null>(null);

function searchBoxReducer(
  state: SearchBoxState,
  action: SearchBoxAction,
): SearchBoxState {
  switch (action.type) {
    case 'queryChanged':
      return {
        query: action.query,
        status: 'idle',
        invalidFor: null,
      };

    case 'submitted':
      return {
        ...state,
        status: 'validating',
        invalidFor: null,
      };

    case 'validationFailed':
      return {
        ...state,
        status: 'invalid',
        invalidFor: action.query,
      };

    case 'navigationStarted':
      return {
        ...state,
        status: 'navigating',
      };

    case 'validationErrored':
      return {
        ...state,
        status: 'idle',
      };

    case 'reset':
      return initialSearchBoxState;
  }
}

export function HomeSearchBox() {
  return (
    <Toast.Provider toastManager={toastManager} limit={1}>
      <SearchBox.Provider>
        <HomeSearchBoxInner />
        <SearchBox.Toasts side="bottom" />
      </SearchBox.Provider>
    </Toast.Provider>
  );
}

export function DictionarySearchBox() {
  return (
    <Toast.Provider toastManager={toastManager} limit={1}>
      <SearchBox.Provider>
        <DictionarySearchBoxInner />
        <SearchBox.Toasts side="top" />
      </SearchBox.Provider>
    </Toast.Provider>
  );
}

function HomeSearchBoxInner() {
  const {
    actions: { submit },
    meta: { inputRef },
  } = useSearchBoxContext();

  useEffect(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    void submit();
  }

  return (
    <form onSubmit={handleSubmit}>
      <SearchBox.Group>
        <SearchBox.Input />
        <SearchBox.Addon>
          <SearchBox.Button />
        </SearchBox.Addon>
      </SearchBox.Group>
    </form>
  );
}

function DictionarySearchBoxInner() {
  const pathname = usePathname();
  const {
    state: { query },
    actions: { reset, submit },
    meta: { inputRef },
  } = useSearchBoxContext();
  const [focused, setFocused] = useState(false);
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    inputRef.current?.blur();
    reset();
  }, [inputRef, pathname, reset]);

  useLayoutEffect(() => {
    return () => {
      setFocused(false);
    };
  }, []);

  useHotkey(
    'Mod+K',
    () => {
      if (focused) {
        inputRef.current?.blur();
      } else {
        inputRef.current?.focus();
      }
    },
    { enabled: true },
  );

  useHotkey('Escape', () => inputRef.current?.blur(), {
    target: inputRef,
  });

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    void submit();
  }

  return (
    <form onSubmit={handleSubmit}>
      <SearchBox.Group className="w-2xl shadow-md">
        <SearchBox.Input
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <SearchBox.Addon>
          {focused || hasQuery ? <SearchBox.Button /> : <SearchBox.Hint />}
        </SearchBox.Addon>
      </SearchBox.Group>
    </form>
  );
}

function SearchBoxProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(searchBoxReducer, initialSearchBoxState);
  const pathname = usePathname();
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = state.query.trim();
  const busy = state.status === 'validating' || state.status === 'navigating';
  const invalid = state.invalidFor !== null;

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
  }, []);

  const setQuery = useCallback((query: string) => {
    abortRef.current?.abort();
    dispatch({ type: 'queryChanged', query });
  }, []);

  useLayoutEffect(() => {
    return () => {
      abortRef.current?.abort();
      reset();
    };
  }, [reset]);

  async function submit() {
    const submittedQuery = trimmedQuery;
    if (!submittedQuery || busy || invalid) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: 'submitted' });

    try {
      const result = await getTRPCClient().search.validateQuery.mutate(
        { query: submittedQuery },
        { signal: controller.signal },
      );

      if (controller.signal.aborted) return;

      if (result.valid) {
        const targetPath = dictionaryPath(result.query);

        if (pathname === targetPath) {
          inputRef.current?.blur();
          reset();
          return;
        }

        dispatch({ type: 'navigationStarted' });
        router.push(targetPath);
      } else {
        dispatch({ type: 'validationFailed', query: submittedQuery });
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      dispatch({ type: 'validationErrored' });
      console.error(err);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }

  return (
    <SearchBoxContext.Provider
      value={{
        state: {
          query: state.query,
          busy,
          invalid,
        },
        actions: {
          setQuery,
          submit,
          reset,
        },
        meta: {
          inputRef,
          groupRef,
        },
      }}
    >
      {children}
    </SearchBoxContext.Provider>
  );
}

function useSearchBoxContext() {
  const context = use(SearchBoxContext);
  if (!context) {
    throw new Error(
      'SearchBox parts must be used within <SearchBox.Provider>.',
    );
  }

  return context;
}

function SearchBoxGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const {
    meta: { groupRef },
  } = useSearchBoxContext();
  return (
    <InputGroup ref={groupRef} variant="card" size="lg" className={className}>
      {children}
    </InputGroup>
  );
}

function SearchBoxInput({
  onBlur,
  onFocus,
}: Pick<React.ComponentProps<typeof InputGroupInput>, 'onBlur' | 'onFocus'>) {
  const {
    state: { query, invalid },
    actions: { setQuery },
    meta: { inputRef },
  } = useSearchBoxContext();

  return (
    <InputGroupInput
      ref={inputRef}
      placeholder="Look up definitions…"
      aria-label="Search query"
      autoComplete="off"
      spellCheck={false}
      value={query}
      onChange={(event) => setQuery(event.currentTarget.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      data-invalid={invalid || undefined}
    />
  );
}

function SearchBoxAddon({ children }: { children: ReactNode }) {
  return (
    <InputGroupAddon align="inline-end" size="lg">
      {children}
    </InputGroupAddon>
  );
}

function SearchBoxButton() {
  const {
    state: { query, invalid, busy },
  } = useSearchBoxContext();
  const hasQuery = query.trim().length > 0;

  return (
    <InputGroupButton
      type="submit"
      aria-label="Search"
      variant="default"
      size="icon-lg"
      disabled={!hasQuery || invalid || busy}
    >
      {busy ? <Spinner /> : <Search />}
    </InputGroupButton>
  );
}

function SearchBoxHint() {
  return <Kbd size="lg">{formatForDisplay('Mod+K')}</Kbd>;
}

const SearchBox = {
  Provider: SearchBoxProvider,
  Toasts: SearchBoxToasts,
  Group: SearchBoxGroup,
  Input: SearchBoxInput,
  Addon: SearchBoxAddon,
  Button: SearchBoxButton,
  Hint: SearchBoxHint,
};
