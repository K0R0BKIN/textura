import Link from 'next/link';
import { Logo } from '@/components/logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { SearchButton } from '@/components/sidebar/search-button';
import { SettingsMenu } from '@/components/sidebar/settings-menu';
import { RecentEntries } from '@/features/recent-entries/recent-entries';

import styles from './app-sidebar.module.css';

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu className="flex-row items-center">
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton
              render={
                <Link href="/" aria-label="Home">
                  <Logo variant="nav" />
                </Link>
              }
              className="hover:bg-transparent active:bg-transparent"
            />
          </SidebarMenuItem>

          <SidebarMenuItem className="ml-auto group-data-[collapsible=icon]:ml-0">
            <SidebarTrigger />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SearchButton />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <RecentEntries className={styles.recents} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SettingsMenu />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
