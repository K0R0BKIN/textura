'use client';

import { Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHotkey, formatForDisplay } from '@tanstack/react-hotkeys';
import { TooltipRoot } from '@base-ui/react';
import { Navbar, ThemeSwitcher } from '@/components/navbar/navbar';
import { Logo } from '@/components/logo';
import { SearchBox } from '@/components/search-box';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Kbd } from '@/components/ui/kbd';

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  useHotkey('Mod+Shift+O', () => router.push('/'));

  const tooltipActionsRef = useRef<TooltipRoot.Actions>(null);

  return (
    <>
      <Navbar>
        <Navbar.Start>
          <Tooltip
            actionsRef={tooltipActionsRef}
            onOpenChange={(open, event) => {
              if (!open && event.reason === 'trigger-press') event.cancel();
            }}
          >
            <TooltipTrigger
              render={
                <Link
                  href="/"
                  className="ml-1 rounded-xs p-1"
                  onNavigate={() => tooltipActionsRef.current?.close()}
                />
              }
            >
              <Logo variant="nav" />
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Go to Home <Kbd>{formatForDisplay('Mod+Shift+O')}</Kbd>
            </TooltipContent>
          </Tooltip>
        </Navbar.Start>
        <Navbar.End>
          <ThemeSwitcher />
        </Navbar.End>
      </Navbar>
      <main className="flex h-screen items-start justify-center pt-[40vh]">
        {children}
      </main>
      <div className="fixed inset-x-0 bottom-0">
        <div className="mx-auto w-fit bg-background pb-4">
          <Suspense>
            <SearchBox variant="command" />
          </Suspense>
        </div>
      </div>
    </>
  );
}
