import { Logo } from '@/components/logo';
import { Composer } from '@/components/composer';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col">
        <Logo />
        <Composer />
      </div>
    </div>
  );
}
