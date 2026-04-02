'use client';

import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useTransition,
  type SyntheticEvent,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toast } from '@base-ui/react/toast';
import { useHotkey } from '@tanstack/react-hotkeys';
import {
  AnimatePresence,
  motion,
  type HTMLMotionProps,
  useReducedMotion,
} from 'motion/react';
import { Search, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';
import { getTRPCClient } from '@/trpc/client';

const toastManager = Toast.createToastManager();

function SearchBoxToasts() {
  const { toasts } = Toast.useToastManager();
  const reduceMotion = useReducedMotion();
  return (
    <Toast.Portal>
      <Toast.Viewport>
        <AnimatePresence>
          {toasts.map((toast) => {
            const side = toast.positionerProps?.side ?? 'bottom';
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

export function SearchBox() {
  const groupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    query,
    hasQuery,
    isInvalid,
    isValidating,
    handleQueryChange,
    handleSubmit,
  } = useSearchBox();

  useEffect(() => {
    if (isInvalid) {
      const id = toastManager.add({
        type: 'error',
        description: 'This query looks invalid',
        positionerProps: {
          anchor: groupRef.current,
          side: 'bottom',
          sideOffset: 8,
          align: 'start',
          alignOffset: 4,
        },
      });
      return () => toastManager.close(id);
    }
  }, [isInvalid]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useHotkey('Escape', () => inputRef.current?.blur(), {
    target: inputRef,
  });

  return (
    <Toast.Provider toastManager={toastManager} limit={1}>
      <form onSubmit={handleSubmit}>
        <InputGroup ref={groupRef} variant="card" size="lg" className="w-lg">
          <InputGroupInput
            ref={inputRef}
            placeholder="Look up definitions…"
            aria-label="Search query"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={handleQueryChange}
            data-invalid={isInvalid || undefined}
          />
          <InputGroupAddon align="inline-end" size="lg">
            <InputGroupButton
              type="submit"
              aria-label="Search"
              variant="default"
              size="icon-lg"
              disabled={!hasQuery || isValidating || isInvalid}
            >
              {isValidating ? <Spinner /> : <Search />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
      <SearchBoxToasts />
    </Toast.Provider>
  );
}

type SearchState = {
  query: string;
  status: 'idle' | 'validating' | 'invalid';
  invalidFor: string | null;
};

type SearchAction =
  | { type: 'queryChanged'; query: string }
  | { type: 'submitted' }
  | { type: 'validationFailed'; query: string }
  | { type: 'reset' };

const initialSearchState: SearchState = {
  query: '',
  status: 'idle',
  invalidFor: null,
};

function searchReducer(
  state: SearchState,
  action: SearchAction,
): SearchState {
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

    case 'reset':
      return initialSearchState;
  }
}

function useSearchBox() {
  const [state, dispatch] = useReducer(searchReducer, initialSearchState);
  const [isPending, transition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  useLayoutEffect(() => {
    return () => {
      abortRef.current?.abort();
      dispatch({ type: 'reset' });
    };
  }, []);

  const hasQuery = state.query.trim().length > 0;
  const isValidating = isPending;
  const isInvalid =
    state.status === 'invalid' && state.invalidFor === state.query.trim();

  function handleQueryChange(event: SyntheticEvent<HTMLInputElement>) {
    abortRef.current?.abort();
    dispatch({ type: 'queryChanged', query: event.currentTarget.value });
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const submittedQuery = state.query.trim();
    if (!submittedQuery || isValidating || isInvalid) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: 'submitted' });

    transition(async () => {
      try {
        const result = await getTRPCClient().search.validateQuery.mutate(
          { query: submittedQuery },
          { signal: controller.signal },
        );

        if (controller.signal.aborted) return;

        if (result.valid) {
          const targetPath = `/dictionary/${encodeURIComponent(result.query)}/en-us`;

          if (pathname === targetPath) {
            dispatch({ type: 'reset' });
            router.refresh();
            return;
          }

          router.push(targetPath);
        } else {
          dispatch({ type: 'validationFailed', query: submittedQuery });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(error);
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    });
  }

  return {
    query: state.query,
    hasQuery,
    isInvalid,
    isValidating,
    handleQueryChange,
    handleSubmit,
  };
}
