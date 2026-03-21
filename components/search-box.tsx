'use client';

import { type SubmitEvent, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cva, type VariantProps } from 'class-variance-authority';
import { useHotkey, formatForDisplay } from '@tanstack/react-hotkeys';

import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';
import { AnimatePresence, motion } from 'motion/react';

import { Search } from 'lucide-react';

const searchBoxVariants = cva('', {
  variants: {
    variant: {
      default: 'w-lg',
      command: 'w-2xl shadow-md',
    },
  },
  defaultVariants: { variant: 'default' },
});

export function SearchBox({
  variant = 'default',
}: VariantProps<typeof searchBoxVariants>) {
  const [query, setQuery] = useState(useSearchParams().get('q') ?? '');
  const [focused, setFocused] = useState(false);
  const hasQuery = query.trim().length > 0;
  const showButton = variant === 'default' || focused || hasQuery;
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (variant === 'default') inputRef.current?.focus();
  }, [variant]);

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

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    if (term) {
      router.push('/dictionary/' + encodeURIComponent(term) + '/en-us');
      setQuery('');
      inputRef.current?.blur();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup
        variant="card"
        size="lg"
        className={searchBoxVariants({ variant })}
      >
        <InputGroupInput
          ref={inputRef}
          placeholder="Look up definitions…"
          aria-label="Search query"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
                  disabled={!hasQuery}
                >
                  <Search />
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
  );
}
