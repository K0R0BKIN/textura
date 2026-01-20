'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';

export function Composer() {
  return (
    <InputGroup
      className={cn(
        'h-[56px] rounded-[20px] border-(--sand-6) bg-(--sand-1) shadow-[0_4px_20px_rgba(32,32,32,0.06)] transition-colors',

        // Hover state
        'hover:border-(--sand-8)',
        'hover:shadow-[0_4px_20px_rgba(32,32,32,0.08)]',

        // Focus state
        'has-[[data-slot=input-group-control]:focus-visible]:border-(--sand-8)',
        'has-[[data-slot=input-group-control]:focus-visible]:ring-0',
        'has-[[data-slot=input-group-control]:focus-visible]:shadow-[0_4px_20px_rgba(32,32,32,0.08)]',

        // Dark mode
        'dark:bg-(--sand-3)',

        // Dark mode interactions
        'dark:hover:border-(--sand-7)',
        'dark:has-[[data-slot=input-group-control]:focus-visible]:border-(--sand-7)',
      )}
    >
      <InputGroupInput
        className="px-[16px]"
        placeholder="Look up definitions..."
      />
      <InputGroupAddon
        className="pr-[8px] has-[>button]:mr-0"
        align="inline-end"
      >
        <InputGroupButton
          variant="default"
          size="icon-lg"
          className="dark:bg-(--brown-8) dark:hover:bg-(--brown-9)"
        >
          <Search />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
