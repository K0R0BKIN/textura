import Toolbar from '@/components/Toolbar';
import SearchBox from '@/components/SearchBox';

function Logo({ text }: { text: string }) {
  return (
    <span className="absolute bottom-full -translate-y-4 font-serif text-6xl leading-none font-black select-none sm:text-7xl">
      {text}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="h-screen">
      <Toolbar />
      <main className="flex h-full items-start justify-center pt-75">
        <div className="relative flex justify-center">
          <Logo text="Textura" />
          <SearchBox />
        </div>
      </main>
    </div>
  );
}
