'use client';

import { HomeLink } from '@/components/navbar/home-link';
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
          <HomeLink />
        </Navbar.Start>
        <Navbar.End>
          <ThemeSwitcher />
        </Navbar.End>
      </Navbar>
      <main className="min-h-screen py-24">{children}</main>
    </>
  );
}
