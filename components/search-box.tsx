'use client';

import { type SubmitEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';

import { Search } from 'lucide-react';

export function SearchBox() {
  const [query, setQuery] = useState('');
  const hasQuery = query.trim().length > 0;
  const router = useRouter();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    if (term) router.push('/word/' + encodeURIComponent(term));
  }

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup variant="card" size="lg" className="w-lg">
        <InputGroupInput
          placeholder="Look up definitions…"
          aria-label="Search query"
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
