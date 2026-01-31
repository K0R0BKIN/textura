'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Sun, Moon } from 'lucide-react';

export default function ThemeSwitch() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Change theme"
            className="rounded-full text-(--sand-12) hover:bg-(--brown-a3)/70 aria-expanded:bg-transparent aria-expanded:hover:bg-(--brown-a3)/70 dark:text-(--gray-11) dark:hover:bg-(--gray-1) dark:hover:text-(--gray-12) aria-expanded:dark:hover:bg-(--gray-1)"
          >
            {resolvedTheme === 'dark' ? (
              <Moon aria-hidden="true" />
            ) : (
              <Sun aria-hidden="true" />
            )}
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className={cn(
          'rounded-[12px] border border-(--sand-7) bg-(--sand-1) shadow-[0px_2px_8px] ring-0 shadow-black/8 **:data-[slot=dropdown-menu-radio-item]:rounded-[8px] **:data-[slot=dropdown-menu-radio-item]:text-(--sand-12) **:data-[slot=dropdown-menu-radio-item]:focus:bg-(--brown-a3)/70 dark:bg-(--gray-5) dark:shadow-black/24 **:data-[slot=dropdown-menu-radio-item]:dark:text-(--gray-11) **:data-[slot=dropdown-menu-radio-item]:dark:focus:bg-(--gray-3) **:data-[slot=dropdown-menu-radio-item]:dark:focus:**:text-(--gray-12) **:data-[slot=dropdown-menu-radio-item]:dark:focus:text-(--gray-12)',
        )}
      >
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
