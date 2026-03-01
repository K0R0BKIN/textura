'use client';

import dynamic from 'next/dynamic';

const ThemeSwitcher = dynamic(() => import('./theme-switcher'), {
  ssr: false,
});

export function Navbar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="fixed top-0 grid h-14 w-full grid-cols-[1fr_1fr] items-center px-2">
      {children}
    </header>
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
