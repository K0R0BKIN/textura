'use client';

import { type SubmitEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cva, type VariantProps } from 'class-variance-authority';

import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';

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
  const hasQuery = query.trim().length > 0;
  const router = useRouter();

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
          placeholder="Look up definitions…"
          aria-label="Search query"
          autoComplete="off"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <InputGroupAddon align="inline-end" size="lg">
          <InputGroupButton
            type="submit"
            aria-label="Search"
            variant="default"
            size="icon-lg"
            disabled={!hasQuery}
          >
            <Search />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
