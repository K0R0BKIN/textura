'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHotkey, formatForDisplay } from '@tanstack/react-hotkeys';
import { Navbar, ThemeSwitcher } from '@/components/navbar/navbar';
import { Logo } from '@/components/logo';
import { SearchBox } from '@/components/search-box';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Kbd } from '@/components/ui/kbd';

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
  const router = useRouter();
  useHotkey('Mod+Shift+O', () => router.push('/'));

  return (
    <>
      <Navbar>
        <Navbar.Start>
          <Tooltip>
            <TooltipTrigger render={<Link href="/" className="ml-2" />}>
              <Logo variant="nav" />
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Go to Home <Kbd>{formatForDisplay('Mod+Shift+O')}</Kbd>
            </TooltipContent>
          </Tooltip>
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
