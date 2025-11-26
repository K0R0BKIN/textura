import { useState } from "react";
import "@fontsource-variable/inter";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

function SearchBox() {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState("");

  return (
    <div className="flex">
      <div
        className={`shadow-claude/6 hover:shadow-claude/8 border-gray-5 hover:border-gray-6 flex h-15 w-xs items-center gap-2 rounded-[20px] border bg-white p-2.5 pl-[18px] shadow-neutral-950 transition-colors sm:w-lg ${
          isFocused && "shadow-claude/8 border-gray-6"
        }`}
      >
        <input
          type="text"
          placeholder="Look up definitions..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
    </div>
  );
}

function App() {
  return (
    <>
      <div className="bg-brown-2 flex min-h-screen items-center justify-center">
        <SearchBox />
      </div>
    </>
  );
}

export default App;
