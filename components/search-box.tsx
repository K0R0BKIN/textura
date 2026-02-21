'use client';

import { useState } from 'react';

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

  return (
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
          aria-label="Search"
          variant="default"
          size="icon-lg"
          disabled={!hasQuery}
        >
          <Search />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
