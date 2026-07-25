'use client';

import type { Route } from 'next';
import Link from 'next/link';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { slugToVariety } from '@/lib/schemas';

import { useRecentEntries } from './use-recent-entries';

export function RecentEntries() {
  const { recentEntries } = useRecentEntries();

  if (recentEntries.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Recents</SidebarGroupLabel>
      <SidebarMenu>
        {recentEntries.map((entry) => {
          const href =
            `/dictionary/${slugToVariety.encode(entry.variety)}/${encodeURIComponent(entry.form)}` as Route;

          return (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton render={<Link href={href} />}>
                <span>{entry.form}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
