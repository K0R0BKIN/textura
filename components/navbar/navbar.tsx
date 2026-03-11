'use client';

import dynamic from 'next/dynamic';
import { TooltipProvider } from '@/components/ui/tooltip';

const ThemeSwitcher = dynamic(() => import('./theme-switcher'), {
  ssr: false,
});

export function Navbar({ children }: { children?: React.ReactNode }) {
  return (
    <TooltipProvider>
      <header className="fixed inset-x-0 top-0 grid h-14 grid-cols-[1fr_1fr] items-center px-2">
        {children}
      </header>
    </TooltipProvider>
  );
}

Navbar.Start = function NavbarStart({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="col-start-1 flex items-center justify-self-start">
      {children}
    </div>
  );
};

Navbar.End = function NavbarEnd({ children }: { children?: React.ReactNode }) {
  return (
    <div className="col-start-2 flex items-center justify-self-end">
      {children}
    </div>
  );
};

export { ThemeSwitcher };
