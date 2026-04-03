'use client';

import { usePathname } from 'next/navigation';
import { Logo } from '@/components/logo';
import { SearchBox } from '@/components/search-box';

function HomeSearchBox() {
  const pathname = usePathname();

  return <SearchBox key={pathname} />;
}

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Logo />
      <HomeSearchBox />
    </div>
  );
}
