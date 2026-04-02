'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHotkey, formatForDisplay } from '@tanstack/react-hotkeys';
import { TooltipRoot } from '@base-ui/react';
import { Search } from 'lucide-react';
import { Navbar, ThemeSwitcher } from '@/components/navbar/navbar';
import { NavbarButton } from '@/components/navbar/navbar-button';
import { Logo } from '@/components/logo';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Kbd } from '@/components/ui/kbd';

export default function DictionaryLayout({
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
          <NavbarButton tooltip="Search">
            <Search />
          </NavbarButton>
          <ThemeSwitcher />
        </Navbar.End>
      </Navbar>
      <main className="pt-24 pb-16">{children}</main>
    </>
  );
}
