import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';

import { Search } from 'lucide-react';

export function SearchBox() {
  return (
    <InputGroup variant="card" size="lg" className="w-lg">
      <InputGroupInput
        placeholder="Look up definitions…"
        aria-label="Search query"
        autoFocus
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton aria-label="Search">
          <Search />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
