'use client';

import { Logo } from '@/components/logo';
import { Navbar } from '@/components/navbar/navbar';
import ThemeSwitcher from '@/components/navbar/theme-switcher';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar>
        <Navbar.Start>
          <Navbar.Link href="/" aria-label="Home" className="ml-1">
            <Logo variant="nav" />
          </Navbar.Link>
        </Navbar.Start>
        <Navbar.End>
          <ThemeSwitcher />
        </Navbar.End>
      </Navbar>
      <main className="min-h-screen pt-24 pb-10">{children}</main>
    </>
  );
}
