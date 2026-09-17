import { Navbar } from '@/components/navbar/navbar';
import { SettingsMenu } from '@/components/navbar/settings-menu';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar>
        <Navbar.End>
          <SettingsMenu />
        </Navbar.End>
      </Navbar>
      <main className="flex min-h-svh items-start justify-center px-4 pt-[25vh]">
        {children}
      </main>
    </>
  );
}
