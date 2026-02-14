'use client';

import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export default function ThemeSwitcher() {
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';

  return (
    <Button variant="ghost" size="icon-lg">
      {isDarkTheme ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
    </Button>
  );
}
