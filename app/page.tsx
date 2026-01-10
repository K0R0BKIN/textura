import { SearchBox } from '@/components/SearchBox';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="font-serif text-6xl text-text-primary mb-12">
          Textura
        </h1>
        <SearchBox variant="landing" autoFocus={true} />
      </div>
    </div>
  );
}
