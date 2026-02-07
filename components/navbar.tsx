'use client';

import dynamic from 'next/dynamic';

const ThemeSwitcher = dynamic(() => import('@/components/theme-switcher'), {
  ssr: false,
});

export function Navbar() {
  return (
    <header className="fixed top-0 flex h-14 w-full items-center justify-end px-2">
      <ThemeSwitcher />
    </header>
  );
}
