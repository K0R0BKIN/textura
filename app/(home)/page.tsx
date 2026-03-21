import { Suspense } from 'react';
import { Logo } from '@/components/logo';
import { SearchBox } from '@/components/search-box';

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Logo />
      <Suspense>
        <SearchBox />
      </Suspense>
    </div>
  );
}
