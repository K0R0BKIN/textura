'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
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

function useSearchBox() {
  const [query, setQuery] = useState('');
  const [invalidFor, setInvalidFor] = useState<string | null>(null);
  const [isPending, transition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  useLayoutEffect(() => {
    return () => {
      abortRef.current?.abort();
      setQuery('');
      setInvalidFor(null);
    };
  }, []);

  const hasQuery = query.trim().length > 0;
  const isValidating = isPending;
  const isInvalid = invalidFor !== null && invalidFor === query.trim();

  function handleQueryChange(event: SyntheticEvent<HTMLInputElement>) {
    const next = event.currentTarget.value;
    setQuery(next);
    setInvalidFor(null);
    abortRef.current?.abort();
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();

    const submittedQuery = query.trim();
    if (!submittedQuery || isValidating || isInvalid) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    transition(async () => {
      try {
        const result = await getTRPCClient().search.validateQuery.mutate(
          { query: submittedQuery },
          { signal: controller.signal },
        );

        if (result.valid) {
          const targetPath = `/dictionary/${encodeURIComponent(result.query)}/en-us`;

          if (pathname === targetPath) {
            transition(() => {
              setQuery('');
              setInvalidFor(null);
            });
            router.refresh();
            return;
          }

          router.push(targetPath);
        } else {
          transition(() => setInvalidFor(submittedQuery));
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        transition(() => setInvalidFor(null));
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    });
  }

  return {
    query,
    hasQuery,
    isInvalid,
    isValidating,
    handleQueryChange,
    handleSubmit,
  };
}
