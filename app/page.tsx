import { Composer } from '@/components/composer';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg">
        <Composer />
      </div>
    </div>
  );
}
