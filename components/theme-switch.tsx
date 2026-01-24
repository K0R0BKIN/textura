'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThemeSwitch() {
  const { resolvedTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      className="text-foreground dark:text-muted-foreground rounded-full hover:bg-(--sand-a3) dark:hover:bg-(--sand-a3)"
    >
      {resolvedTheme === 'dark' ? <Moon /> : <Sun />}
    </Button>
  );
}
