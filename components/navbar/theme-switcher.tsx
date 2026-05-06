'use client';

import { FocusScope } from '@react-aria/focus';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Navbar } from '@/components/navbar/navbar';

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Navbar.Button aria-label="Change theme">
            <Sun aria-hidden="true" className="dark:hidden" />
            <Moon aria-hidden="true" className="not-dark:hidden" />
          </Navbar.Button>
        }
      />
      <DropdownMenuContent align="end" finalFocus={false}>
        <FocusScope restoreFocus>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </FocusScope>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
