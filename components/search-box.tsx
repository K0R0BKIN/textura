'use client';

import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type SyntheticEvent,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toast } from '@base-ui/react/toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { formatForDisplay, useHotkey } from '@tanstack/react-hotkeys';
import {
  AnimatePresence,
  motion,
  type HTMLMotionProps,
  useReducedMotion,
} from 'motion/react';
import { Search, X } from 'lucide-react';
import { useSpinDelay } from 'spin-delay';
import { Kbd } from '@/components/ui/kbd';
import { Spinner } from '@/components/ui/spinner';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';
import { dictionaryPath } from '@/lib/dictionary/routes';
import { getTRPCClient } from '@/trpc/client';

const toastManager = Toast.createToastManager();

const searchBoxVariants = cva('', {
  variants: {
    variant: {
      default: 'w-lg',
      command: 'w-2xl shadow-md',
    },
  },
  defaultVariants: { variant: 'default' },
});

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

type SearchState = {
  query: string;
  status: 'idle' | 'validating' | 'invalid' | 'navigating';
  invalidFor: string | null;
};

type SearchAction =
  | { type: 'queryChanged'; query: string }
  | { type: 'submitted' }
  | { type: 'validationFailed'; query: string }
  | { type: 'navigationStarted' }
  | { type: 'validationSettled' }
  | { type: 'reset' };

const initialSearchState: SearchState = {
  query: '',
  status: 'idle',
  invalidFor: null,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
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

    case 'validationSettled':
      return {
        ...state,
        status: 'idle',
      };

    case 'reset':
      return initialSearchState;
  }
}

export function SearchBox({
  variant = 'default',
}: VariantProps<typeof searchBoxVariants>) {
  const resolvedVariant = variant ?? 'default';
  const groupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [commandAddon, setCommandAddon] = useState<'shortcut' | 'submit'>(
    'shortcut',
  );
  const {
    query,
    hasQuery,
    isInvalid,
    isBusy,
    handleQueryChange,
    handleSubmit,
  } = useSearchBox({
    onCurrentArticleMatch: () => {
      inputRef.current?.blur();
      setCommandAddon('shortcut');
    },
  });
  const reduceMotion = useReducedMotion();
  const showSpinner = useSpinDelay(isBusy, {
    delay: 80,
    minDuration: 180,
  });
  const showButton = resolvedVariant === 'default' || commandAddon === 'submit';

  useEffect(() => {
    if (isInvalid) {
      const id = toastManager.add({
        type: 'error',
        description: 'This query looks invalid',
        positionerProps: {
          anchor: groupRef.current,
          side: resolvedVariant === 'command' ? 'top' : 'bottom',
          sideOffset: 8,
          align: 'start',
          alignOffset: 4,
        },
      });
      return () => toastManager.close(id);
    }
  }, [isInvalid, resolvedVariant]);

  useEffect(() => {
    if (resolvedVariant === 'default') inputRef.current?.focus();
  }, [resolvedVariant]);

  useHotkey(
    'Mod+K',
    () => {
      if (document.activeElement === inputRef.current) inputRef.current?.blur();
      else inputRef.current?.focus();
    },
    { enabled: resolvedVariant === 'command' },
  );

  useHotkey('Escape', () => inputRef.current?.blur(), {
    target: inputRef,
  });

  function handleInputFocus() {
    if (resolvedVariant === 'command') {
      setCommandAddon('submit');
    }
  }

  function handleInputBlur() {
    if (resolvedVariant !== 'command') return;
    if (hasQuery || isBusy || isInvalid) return;
    setCommandAddon('shortcut');
  }

  function handleInputChange(event: SyntheticEvent<HTMLInputElement>) {
    if (resolvedVariant === 'command' && event.currentTarget.value.trim() !== '') {
      setCommandAddon('submit');
    }

    handleQueryChange(event);
  }

  return (
    <Toast.Provider toastManager={toastManager} limit={1}>
      <form onSubmit={handleSubmit}>
        <InputGroup
          ref={groupRef}
          variant="card"
          size="lg"
          className={searchBoxVariants({ variant: resolvedVariant })}
        >
          <InputGroupInput
            ref={inputRef}
            placeholder="Look up definitions…"
            aria-label="Search query"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            data-invalid={isInvalid || undefined}
          />
          <InputGroupAddon align="inline-end" size="lg">
            <AnimatePresence mode="wait" initial={false}>
              {showButton ? (
                <motion.div
                  key="button"
                  initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.85 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.12, ease: 'easeOut' },
                  }}
                  exit={{
                    opacity: 0,
                    scale: reduceMotion ? 1 : 0.85,
                    transition: { duration: 0.08, ease: 'easeIn' },
                  }}
                >
                  <InputGroupButton
                    type="submit"
                    aria-label="Search"
                    variant="default"
                    size="icon-lg"
                    disabled={!hasQuery || isInvalid || showSpinner}
                  >
                    {showSpinner ? <Spinner /> : <Search />}
                  </InputGroupButton>
                </motion.div>
              ) : (
                <motion.div
                  key="kbd"
                  initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.85 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.12, ease: 'easeOut' },
                  }}
                  exit={{
                    opacity: 0,
                    scale: reduceMotion ? 1 : 0.85,
                    transition: { duration: 0.08, ease: 'easeIn' },
                  }}
                >
                  <Kbd size="lg">{formatForDisplay('Mod+K')}</Kbd>
                </motion.div>
              )}
            </AnimatePresence>
          </InputGroupAddon>
        </InputGroup>
      </form>
      <SearchBoxToasts />
    </Toast.Provider>
  );
}

function useSearchBox({
  onCurrentArticleMatch,
}: {
  onCurrentArticleMatch?: () => void;
}) {
  const [state, dispatch] = useReducer(searchReducer, initialSearchState);
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
  const isBusy =
    state.status === 'validating' || state.status === 'navigating';
  const isInvalid =
    state.invalidFor !== null && state.invalidFor === state.query.trim();

  function handleQueryChange(event: SyntheticEvent<HTMLInputElement>) {
    abortRef.current?.abort();
    dispatch({ type: 'queryChanged', query: event.currentTarget.value });
  }

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();

    const submittedQuery = state.query.trim();
    if (!submittedQuery || isBusy || isInvalid) return;

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
          onCurrentArticleMatch?.();
          dispatch({ type: 'reset' });
          return;
        }

        dispatch({ type: 'navigationStarted' });
        router.push(targetPath);
      } else {
        dispatch({ type: 'validationFailed', query: submittedQuery });
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      dispatch({ type: 'validationSettled' });
      console.error(err);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }

  return {
    query: state.query,
    hasQuery,
    isInvalid,
    isBusy,
    handleQueryChange,
    handleSubmit,
  };
}
