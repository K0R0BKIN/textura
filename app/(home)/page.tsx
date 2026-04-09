import { Logo } from '@/components/logo';
import HomeSearchBox from './home-search-box';

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Logo />
      <HomeSearchBox />
    </div>
  );
}
