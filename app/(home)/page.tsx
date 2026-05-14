import { Logo } from '@/components/logo';
import { Composer } from '@/components/composer';

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Logo />
      <Composer />
    </div>
  );
}
