import { Logo } from '@/components/logo';
import { SearchBox } from '@/components/search-box';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <SearchBox />
      </div>
    </div>
  );
}
