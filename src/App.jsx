import { useState } from "react";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

function SearchBox() {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex">
      <div
        className={`shadow-claude group flex w-xs gap-2 rounded-2xl border bg-white p-2 pl-4 transition-colors sm:w-lg ${
          isFocused
            ? "border-gray-300"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <input
          type="text"
          placeholder="Look up definitions..."
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full text-base text-gray-700 outline-none"
          autoFocus
        />
        <button
          className="bg-brown-9 hover:bg-brown-10 flex h-8 w-8 items-center justify-center rounded-lg text-white disabled:pointer-events-none disabled:opacity-50"
          disabled
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
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
