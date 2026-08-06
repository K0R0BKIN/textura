import { SearchIcon } from 'lucide-react';

import { Kbd } from '@/components/ui/kbd';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

import styles from './search-button.module.css';

export function SearchButton() {
  return (
    <SidebarMenuButton
      aria-label="Search"
      tooltip="Search"
      variant="card"
      className={styles.root}
    >
      <SearchIcon aria-hidden="true" className={styles.icon} />

      <span
        className={cn(
          styles.label,
          'whitespace-nowrap',
          'group-data-[collapsible=icon]:opacity-0',
        )}
      >
        Search
      </span>

      <Kbd
        aria-hidden="true"
        className={cn(
          'mr-0.5 ml-auto shrink-0 text-muted-foreground opacity-0',
          'transition-opacity duration-100 motion-reduce:transition-none',
          'group-hover/menu-button:opacity-100',
          'group-focus-visible/menu-button:opacity-100',
        )}
      >
        ⌘K
      </Kbd>
    </SidebarMenuButton>
  );
}
