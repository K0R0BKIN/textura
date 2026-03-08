'use client';

import { type SubmitEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cva, type VariantProps } from 'class-variance-authority';
import { useHotkey } from '@tanstack/react-hotkeys';

import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';

import { Search } from 'lucide-react';

const searchBoxVariants = cva('', {
  variants: {
    variant: {
      home: 'w-lg',
      article: 'w-2xl shadow-md',
    },
  },
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
    if (term) router.push('/article/' + encodeURIComponent(term));
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
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <InputGroupAddon align="inline-end" size="lg">
          {showButton ? (
            <InputGroupButton
              type="submit"
              aria-label="Search"
              variant="default"
              size="icon-lg"
              disabled={!hasQuery}
            >
              <Search />
            </InputGroupButton>
          ) : (
            <Kbd>⌘K</Kbd>
          )}
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
