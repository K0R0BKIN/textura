'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Navbar, ThemeSwitcher } from '@/components/navbar/navbar';
import { Logo } from '@/components/logo';

const RegenerateButton =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@/components/navbar/regenerate-button'), {
        ssr: false,
      })
    : null;

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
          {RegenerateButton && <RegenerateButton />}
          <ThemeSwitcher />
        </Navbar.End>
      </Navbar>
      {children}
    </>
  );
}
