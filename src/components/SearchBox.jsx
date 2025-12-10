import { useState } from "react";
import SuggestionList from "./SuggestionList.jsx";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { ENTRIES } from "../data/entries.js";

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
        className="text-ui w-full text-black outline-none placeholder:text-(--text-11)"
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
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const isTyping = value.length > 0;

  const MAX_SUGGESTIONS = 6;
  const suggestions = isTyping
    ? ENTRIES.filter(
        (entry) =>
          entry.term.toLowerCase().startsWith(value.toLowerCase()) &&
          entry.term.toLowerCase() !== value.toLowerCase(),
      ).slice(0, MAX_SUGGESTIONS)
    : ENTRIES.slice(0, MAX_SUGGESTIONS);

  const hasResults = suggestions.length > 0;
  const showSuggestions = isFocused && (isTyping ? hasResults : true);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      handleSuggestionClick(suggestions[highlightedIndex]);
    }
  };

  const handleInputChange = (e) => {
    setValue(e.target.value);
    setHighlightedIndex(-1);
  };

  const handleInputBlur = () => {
    if (highlightedIndex < 0) {
      setIsFocused(false);
      setHighlightedIndex(-1);
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleSuggestionClick = (entry) => {
    setValue(entry.term);
    setIsFocused(true);
    setHighlightedIndex(-1);
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
