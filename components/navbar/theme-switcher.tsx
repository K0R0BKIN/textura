'use client';

import { useTheme } from 'next-themes';

import { NavbarButton } from '@/components/navbar/navbar-button';
import { Moon, Sun } from 'lucide-react';

export default function ThemeSwitcher() {
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';

  return (
    <NavbarButton>
      {isDarkTheme ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </NavbarButton>
  );
}
