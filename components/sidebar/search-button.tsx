import { SearchIcon } from 'lucide-react';

import { Kbd } from '@/components/ui/kbd';
import { SidebarMenuButton } from '@/components/ui/sidebar';

export function SearchButton() {
  return (
    <SidebarMenuButton
      tooltip="Search"
      className="group-data-[state=expanded]:gap-1.5 group-data-[state=expanded]:bg-card group-data-[state=expanded]:px-2.5 group-data-[state=expanded]:text-subtle-foreground group-data-[state=expanded]:shadow-xs group-data-[state=expanded]:ring group-data-[state=expanded]:ring-border group-data-[state=expanded]:hover:bg-card group-data-[state=expanded]:hover:text-subtle-foreground group-data-[state=expanded]:active:bg-card group-data-[state=expanded]:active:text-subtle-foreground group-data-[state=expanded]:[&_svg]:size-4"
    >
      <SearchIcon aria-hidden="true" />
      <span>Search</span>
      <Kbd
        aria-hidden="true"
        className="mr-0.5 ml-auto shrink-0 text-muted-foreground opacity-0 transition-opacity duration-100 group-hover/menu-button:opacity-100 group-focus-visible/menu-button:opacity-100"
      >
        ⌘K
      </Kbd>
    </SidebarMenuButton>
  );
}
