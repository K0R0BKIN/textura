import { useState } from "react";
import { MagnifyingGlassIcon, SunIcon } from "@radix-ui/react-icons";

function NavBar({ alignment = "space-between", children }) {
  const alignmentVariants = {
    "space-between": "justify-between",
    end: "justify-end",
  };

  return (
    <nav
      className={`fixed top-0 flex h-[68px] w-full items-center px-4 ${alignmentVariants[alignment]}`}
    >
      {children}
    </nav>
  );
}

function Logo({ text }) {
  return (
    <span className="text-gray-12 absolute bottom-full -translate-y-4 font-serif text-6xl leading-none font-black select-none sm:text-7xl">
      {text}
    </span>
  );
}

function SearchBox() {
  const [value, setValue] = useState("");

  return (
    <div
      className={`shadow-claude/6 hover:shadow-claude/8 focus-within:shadow-claude/8 focus-within:border-gray-6 border-gray-5 hover:border-gray-6 flex h-15 w-xs items-center gap-2 rounded-[20px] border bg-white p-2.5 pl-[18px] shadow-neutral-950 transition-colors sm:w-lg`}
    >
      <input
        type="text"
        placeholder="Look up definitions..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="placeholder:text-gray-11 w-full text-base leading-none font-light outline-none"
        autoFocus
      />
      <button
        className="bg-brown-9 hover:bg-brown-10 flex aspect-square h-full cursor-pointer items-center justify-center rounded-xl text-white disabled:pointer-events-none disabled:opacity-50"
        disabled={value.trim() === ""}
      >
        <MagnifyingGlassIcon className="size-6" />
      </button>
    </div>
  );
}

function AppearanceToggle() {
  return (
    <button className="hover:bg-brown-3 size-9 cursor-pointer rounded-full bg-transparent transition-colors">
      <SunIcon className="text-gray-12 m-auto size-5" />
    </button>
  );
}

export default function HomePage() {
  return (
    <div className="bg-brown-2 h-screen">
      <NavBar alignment="end">
        <AppearanceToggle />
      </NavBar>
      <main className="flex h-full items-center justify-center">
        <div className="relative flex justify-center">
          <Logo text="Textura" />
          <SearchBox />
        </div>
      </main>
    </div>
  );
}
