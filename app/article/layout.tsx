'use client';

import Link from 'next/link';
import { Navbar, ThemeSwitcher } from '@/components/navbar/navbar';
import { Logo } from '@/components/logo';

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar>
        <Navbar.Start>
          <Link href="/" className="ml-2">
            <Logo variant="nav" />
          </Link>
        </Navbar.Start>
        <Navbar.End>
          <ThemeSwitcher />
        </Navbar.End>
      </Navbar>
      {children}
    </>
  );
}
