'use client';

import { type SubmitEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
      home: 'w-lg',
      article: 'w-2xl shadow-md',
    },
  },
  defaultVariants: { variant: 'home' },
});

export function SearchBox({
  variant = 'home',
}: VariantProps<typeof searchBoxVariants>) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const hasQuery = query.trim().length > 0;
  const showButton = variant === 'home' || focused || hasQuery;
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (variant === 'home') inputRef.current?.focus();
  }, [variant]);

  useHotkey(
    'Mod+K',
    () => {
      if (document.activeElement === inputRef.current) inputRef.current?.blur();
      else inputRef.current?.focus();
    },
    { enabled: variant === 'article' },
  );

  useHotkey('Escape', () => inputRef.current?.blur(), {
    target: inputRef,
  });

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    if (term) {
      router.push('/article/' + encodeURIComponent(term));
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
