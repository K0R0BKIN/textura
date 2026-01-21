import { Logo } from '@/components/logo';
import { Composer } from '@/components/composer';

export default function Home() {
  return (
    <div className="flex min-h-screen items-start pt-72 justify-center">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <Logo></Logo>
        <Composer />
      </div>
    </div>
  );
}
