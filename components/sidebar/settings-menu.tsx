'use client';

import { useTheme } from 'next-themes';
import { MonitorIcon, MoonIcon, SettingsIcon, SunIcon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

export function SettingsMenu() {
  const { theme, setTheme } = useTheme();

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <SidebarMenuButton tooltip="Settings" render={<DropdownMenuTrigger />}>
          <SettingsIcon />
          <span className="transition-opacity duration-150 ease-in-out group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none">
            Settings
          </span>
        </SidebarMenuButton>
        <DropdownMenuContent
          side="top"
          sideOffset={8}
          align="start"
          className="w-60"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="system">
                <MonitorIcon />
                System
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="light">
                <SunIcon />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <MoonIcon />
                Dark
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
