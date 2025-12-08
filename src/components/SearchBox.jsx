import { useState } from "react";
import SuggestionList from "./SuggestionList.jsx";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

function SearchBar({ value, onChange, onBlur, onFocus, placeholder }) {
  return (
    <div
      className={`shadow-claude/6 hover:shadow-claude/8 focus-within:shadow-claude/8 focus-within:border-gray-6 border-gray-5 hover:border-gray-6 flex h-15 w-xs items-center gap-2 rounded-[20px] border bg-white p-2 pl-4 shadow-neutral-950 transition-colors sm:w-lg`}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        className="placeholder:text-gray-11 w-full text-base leading-none font-light text-black outline-none"
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

  const handleInputChange = (e) => {
    setValue(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleInputFocus = () => {
    value.length > 0 && setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setValue(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <SearchBar
        value={value}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        placeholder={"Look up definitions…"}
      />

      {showSuggestions && (
        <SuggestionList onSuggestionClick={handleSuggestionClick} />
      )}
    </div>
  );
}
