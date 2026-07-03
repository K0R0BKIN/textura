'use client';

import { useTheme } from 'next-themes';
import { MonitorIcon, MoonIcon, SettingsIcon, SunIcon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const themeOptions = [
  { value: 'system', label: 'System', icon: MonitorIcon },
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
];

export function SettingsMenu() {
  const { theme, setTheme } = useTheme();

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton>
              <SettingsIcon />
              <span>Settings</span>
            </SidebarMenuButton>
          }
        />
        <DropdownMenuContent
          side="top"
          sideOffset={8}
          align="start"
          className="w-60"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <ToggleGroup
              aria-label="Theme"
              value={[theme ?? 'system']}
              onValueChange={(value) => {
                const nextTheme = value[0];

                if (nextTheme) {
                  setTheme(nextTheme);
                }
              }}
              variant="outline"
              spacing={0}
              className="w-full"
            >
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  aria-label={label}
                  className="h-auto flex-1 flex-col gap-1 py-2"
                >
                  <Icon />
                  <span className="text-xs">{label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
