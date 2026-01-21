import { Logo } from '@/components/logo';
import { Composer } from '@/components/composer';

export default function Home() {
  return (
    <div className="flex min-h-screen items-start justify-center pt-72">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <Logo></Logo>
        <Composer />
      </div>
    </div>
  );
}
