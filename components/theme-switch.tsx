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
            className="text-foreground rounded-full hover:bg-(--sand-a3) aria-expanded:bg-transparent aria-expanded:hover:bg-(--sand-a3) dark:text-(--sand-11) dark:hover:bg-(--sand-4) aria-expanded:dark:hover:bg-(--sand-4)"
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
          'rounded-[12px] border-[0.5px] border-(--sand-6) bg-(--sand-1) shadow-[0px_2px_8px_0px_rgba(0,0,0,0.08)] ring-0 **:data-[slot=dropdown-menu-radio-item]:rounded-[8px] **:data-[slot=dropdown-menu-radio-item]:focus:bg-(--sand-3) dark:bg-(--sand-3) dark:shadow-[0px_2px_8px_0px_rgba(0,0,0,0.24)] **:data-[slot=dropdown-menu-radio-item]:dark:focus:bg-(--sand-5)',
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
