'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

export function Composer() {
  const [inputValue, setInputValue] = useState('');
  const isSearchDisabled = inputValue.trim().length === 0;

  return (
    <InputGroup
      className={cn(
        'h-[56px] rounded-[20px] border-(--sand-7) bg-(--sand-1) transition-colors dark:bg-(--gray-5)',
      )}
    >
      <InputGroupInput
        className="px-[16px] placeholder:text-(--sand-9) dark:placeholder:text-(--gray-10)"
        placeholder="Look up definitions..."
        aria-label="Search query"
        autoFocus
        value={inputValue}
        onChange={(e) => setInputValue(e.currentTarget.value)}
      />
      <InputGroupAddon
        className="pr-[8px] has-[>button]:mr-0"
        align="inline-end"
      >
        <InputGroupButton
          variant="default"
          size="icon-lg"
          className="bg-(--brown-9) text-(--sand-1) hover:bg-(--brown-10) dark:bg-(--brown-9)/80 dark:text-(--sand-12) dark:hover:bg-(--brown-9)"
          disabled={isSearchDisabled}
          aria-label="Search"
        >
          <Search />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
