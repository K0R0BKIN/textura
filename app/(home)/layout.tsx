'use client';

import { Navbar, ThemeSwitcher } from '@/components/navbar/navbar';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar>
        <Navbar.End>
          <ThemeSwitcher />
        </Navbar.End>
      </Navbar>
      {children}
    </>
  );
}
