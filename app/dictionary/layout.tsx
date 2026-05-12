'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { type Hotkey } from '@tanstack/react-hotkeys';
import { TooltipRoot } from '@base-ui/react';
import { Navbar } from '@/components/navbar/navbar';
import ThemeSwitcher from '@/components/navbar/theme-switcher';
import { Logo } from '@/components/logo';
import {
  Tooltip,
  TooltipTrigger,
  TooltipShortcut,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useHotkeyActions, type HotkeyAction } from '@/lib/hotkey';

export default function DictionaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tooltipActionsRef = useRef<TooltipRoot.Actions>(null);
  const router = useRouter();

  const home: HotkeyAction = {
    name: 'Home',
    hotkey: 'Mod+Shift+O' as Hotkey,
    callback: () => router.push('/'),
  };

  useHotkeyActions([home]);

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
                <Navbar.Link
                  href="/"
                  aria-label={home.name}
                  className="ml-1"
                  onNavigate={() => tooltipActionsRef.current?.close()}
                >
                  <Logo variant="nav" />
                </Navbar.Link>
              }
            />
            <TooltipContent side="right" sideOffset={8}>
              {home.name} <TooltipShortcut hotkey={home.hotkey} />
            </TooltipContent>
          </Tooltip>
        </Navbar.Start>
        <Navbar.End>
          <ThemeSwitcher />
        </Navbar.End>
      </Navbar>
      <main className="pt-24 pb-16">{children}</main>
    </>
  );
}
