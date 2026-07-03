import { SunIcon } from 'lucide-react';

import { SidebarMenuButton } from '@/components/ui/sidebar';

export function ThemeSwitcher() {
  return (
    <SidebarMenuButton>
      <SunIcon aria-hidden="true" />
      <span>Appearance</span>
    </SidebarMenuButton>
  );
}
