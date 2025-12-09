import { useState } from "react";
import SuggestionList from "./SuggestionList.jsx";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

const SUGGESTIONS = [
  { word: "Serendipity", definition: "finding something good by happy chance" },
  {
    word: "Eloquent",
    definition: "fluent, persuasive, and expressive in speech",
  },
  {
    word: "Mellifluous",
    definition: "sweet or musical in sound; pleasant to hear",
  },
  { word: "Ephemeral", definition: "lasting for a very short time; fleeting" },
  { word: "Ubiquitous", definition: "present, appearing, or found everywhere" },
  { word: "Pragmatic", definition: "dealing with things in a realistic way" },
];

function SearchBar({
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  placeholder,
}) {
  return (
    <div
      className={`shadow-claude/6 hover:shadow-claude/8 focus-within:shadow-claude/8 flex h-15 w-xs items-center gap-2 rounded-[20px] border border-(--border-5) bg-white p-2 pl-4 shadow-neutral-950 transition-colors focus-within:border-(--border-6) hover:border-(--border-6) sm:w-lg`}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        className="placeholder:text-(--text-11) w-full text-base leading-none font-light text-black outline-none"
        autoFocus
      />
      <button
        className="bg-brown-9 hover:bg-brown-10 btn btn-icon aspect-square h-full rounded-xl text-white"
        disabled={value.trim() === ""}
      >
        <MagnifyingGlassIcon className="icon size-6" />
      </button>
    </div>
  );
}

export default function SearchBox() {
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions] = useState(SUGGESTIONS);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      handleSuggestionClick(suggestions[highlightedIndex]);
    }
  };

  const handleInputChange = (e) => {
    setValue(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
    setHighlightedIndex(-1);
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleInputFocus = () => {
    value.length > 0 && setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setValue(suggestion.word);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <SearchBar
        value={value}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={"Look up definitions…"}
      />

      {showSuggestions && (
        <SuggestionList
          suggestions={suggestions}
          highlightedIndex={highlightedIndex}
          onSuggestionClick={handleSuggestionClick}
          onSuggestionHover={setHighlightedIndex}
          onSuggestionHoverEnd={() => setHighlightedIndex(-1)}
        />
      )}
    </div>
  );
}
