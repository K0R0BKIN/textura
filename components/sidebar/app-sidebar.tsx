import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { SettingsMenu } from '@/components/sidebar/settings-menu';

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu className="flex-row items-center">
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link href="/" aria-label="Home">
                  <Logo variant="nav" />
                </Link>
              }
              className="hover:bg-transparent active:bg-transparent"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <SearchIcon />
                <span>Search</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SettingsMenu />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
