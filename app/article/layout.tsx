'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Navbar, ThemeSwitcher } from '@/components/navbar/navbar';
import { Logo } from '@/components/logo';
import { SearchBox } from '@/components/search-box';

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
      <div className="pb-32">{children}</div>
      <div className="fixed inset-x-0 bottom-0 flex justify-center pb-4">
        <SearchBox variant="article" />
      </div>
    </>
  );
}
