import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Empty, EmptyDescription } from '@/components/ui/empty';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Kbd } from '@/components/ui/kbd';
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
              <SidebarMenuButton className="h-8 gap-1.5 bg-card px-2.5 text-subtle-foreground shadow-xs ring ring-border hover:bg-card hover:text-subtle-foreground active:bg-card data-open:bg-card [&_svg]:size-4">
                <SearchIcon aria-hidden="true" />
                <span>Search</span>
                <Kbd
                  aria-hidden="true"
                  className="mr-0.5 ml-auto shrink-0 text-muted-foreground opacity-0 transition-opacity duration-100 group-hover/menu-button:opacity-100 group-focus-visible/menu-button:opacity-100"
                >
                  ⌘K
                </Kbd>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm dark:text-subtle-foreground font-semibold text-foreground">
            Recents
          </SidebarGroupLabel>
          <SidebarGroupContent className="pt-1">
            <Empty className="h-12 rounded-lg border border-dashed">
              <EmptyDescription className="text-xs">
                Recent searches will appear here
              </EmptyDescription>
            </Empty>
          </SidebarGroupContent>
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
