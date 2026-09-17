import { Navbar } from '@/components/navbar/navbar';
import { HomeLink } from '@/components/navbar/home-link';
import { SettingsMenu } from '@/components/navbar/settings-menu';

export default function DictionaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar className="border-b border-separator bg-background lg:border-b-0 lg:bg-transparent">
        <Navbar.Start>
          <HomeLink />
        </Navbar.Start>
        <Navbar.End>
          <SettingsMenu />
        </Navbar.End>
      </Navbar>
      <main className="flex min-h-svh flex-col px-4">{children}</main>
    </>
  );
}
