'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Toast } from '@base-ui/react/toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { useHotkey, formatForDisplay } from '@tanstack/react-hotkeys';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

import { triage } from '@/lib/actions';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';

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
            const offset = reduceMotion ? 0 : side === 'top' ? 8 : -8;
            const exitOffset = reduceMotion ? 0 : side === 'top' ? 4 : -4;
            return (
              <Toast.Positioner key={toast.id} toast={toast}>
                <Toast.Root
                  toast={toast}
                  render={(props) => (
                    <motion.div
                      {...props}
                      initial={{ opacity: 0, y: offset }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        y: exitOffset,
                        transition: { duration: 0.1, ease: [0.32, 0.72, 0, 1] },
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 28,
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

export function SearchBox({
  variant = 'default',
}: VariantProps<typeof searchBoxVariants>) {
  const [state, action, pending] = useActionState(triage, null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const hasQuery = query.trim().length > 0;
  const invalid = state !== null && !state.valid && query === state.query;
  const showButton = variant === 'default' || focused || hasQuery;
  const groupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (variant === 'default') inputRef.current?.focus();
  }, [variant]);

  useEffect(() => {
    if (invalid) {
      const id = toastManager.add({
        type: 'error',
        description: 'This query looks invalid',
        positionerProps: {
          anchor: groupRef.current,
          side: variant === 'command' ? 'top' : 'bottom',
          sideOffset: 8,
          align: 'start',
          alignOffset: 4,
        },
      });
      return () => toastManager.close(id);
    }
  }, [invalid, variant]);

  useHotkey(
    'Mod+K',
    () => {
      if (document.activeElement === inputRef.current) inputRef.current?.blur();
      else inputRef.current?.focus();
    },
    { enabled: variant === 'command' },
  );

  useHotkey('Escape', () => inputRef.current?.blur(), {
    target: inputRef,
  });

  return (
    <Toast.Provider toastManager={toastManager} limit={1}>
      <form action={action}>
        <InputGroup
          ref={groupRef}
          variant="card"
          size="lg"
          className={searchBoxVariants({ variant })}
        >
          <InputGroupInput
            ref={inputRef}
            name="query"
            placeholder="Look up definitions…"
            aria-label="Search query"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            data-invalid={invalid || undefined}
            className="data-invalid:underline data-invalid:decoration-destructive data-invalid:decoration-dotted data-invalid:decoration-[2.5px]"
          />
          <InputGroupAddon align="inline-end" size="lg">
            <AnimatePresence mode="wait" initial={false}>
              {showButton ? (
                <motion.div
                  key="button"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.12, ease: 'easeOut' },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.85,
                    transition: { duration: 0.08, ease: 'easeIn' },
                  }}
                >
                  <InputGroupButton
                    type="submit"
                    aria-label="Search"
                    variant="default"
                    size="icon-lg"
                    disabled={!hasQuery || pending || invalid}
                  >
                    {pending ? <Spinner /> : <Search />}
                  </InputGroupButton>
                </motion.div>
              ) : (
                <motion.div
                  key="kbd"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.12, ease: 'easeOut' },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.85,
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
