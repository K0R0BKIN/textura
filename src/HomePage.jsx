import Toolbar from "./Toolbar";
import SearchBox from "./SearchBox";

function Logo({ text }) {
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
      <main className="flex h-full items-center justify-center">
        <div className="relative flex justify-center">
          <Logo text="Textura" />
          <SearchBox placeholder={"Look up definitions…"} />
        </div>
      </main>
    </div>
  );
}
