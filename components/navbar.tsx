'use client';

import dynamic from 'next/dynamic';

const ThemeSwitch = dynamic(() => import('@/components/theme-switch'), {
  ssr: false,
});

export default function Navbar() {
  return (
    <header className="fixed top-0 flex h-14 w-full items-center justify-end bg-transparent px-[8px]">
      <div className="flex items-center">
        <ThemeSwitch />
      </div>
    </header>
  );
}
