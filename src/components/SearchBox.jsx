import { useReducer } from "react";
import SuggestionList from "./SuggestionList.jsx";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { ENTRIES } from "../data/entries.js";

const initialState = {
  query: "",
  isFocused: false,
  activeIndex: -1,
};

function searchBoxReducer(state, action) {
  switch (action.type) {
    case "TYPE":
      return {
        ...state,
        query: action.payload,
        activeIndex: -1,
        isFocused: true,
      };

    case "FOCUS":
      return { ...state, isFocused: true };

    case "BLUR":
      return { ...state, isFocused: false, activeIndex: -1 };

    case "SELECT":
      return {
        ...state,
        query: action.payload,
        isFocused: false,
        activeIndex: -1,
      };

    case "HIGHLIGHT":
      return { ...state, activeIndex: action.payload };

    case "CLOSE":
      return { ...state, isFocused: false, activeIndex: -1 };

    case "NAVIGATE": {
      const { direction, listCount } = action.payload;
      if (listCount === 0) return state;

      let nextIndex = state.activeIndex + direction;

      if (nextIndex >= listCount) nextIndex = 0;
      if (nextIndex < 0) nextIndex = listCount - 1;

      return { ...state, activeIndex: nextIndex };
    }

    default:
      return state;
  }
}

function SearchBar({ value, placeholder, ...props }) {
  return (
    <div className="shadow-claude/6 hover:shadow-claude/8 focus-within:shadow-claude/8 flex h-15 w-xs items-center gap-2 rounded-[20px] border border-(--border-5) bg-white p-2 pl-4 shadow-neutral-950 transition-colors focus-within:border-(--border-6) hover:border-(--border-6) sm:w-lg">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        className="text-ui w-full text-black outline-none placeholder:text-(--text-11)"
        autoFocus
        {...props}
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
  const [state, dispatch] = useReducer(searchBoxReducer, initialState);
  const { query, isFocused, activeIndex } = state;

  const MAX_SUGGESTIONS = 6;
  const isTyping = query.length > 0;

  const suggestions = isTyping
    ? ENTRIES.filter(
        (entry) =>
          entry.term.toLowerCase().startsWith(query.toLowerCase()) &&
          entry.term.toLowerCase() !== query.toLowerCase(),
      ).slice(0, MAX_SUGGESTIONS)
    : ENTRIES.slice(0, MAX_SUGGESTIONS);

  const showSuggestions =
    isFocused && (isTyping ? suggestions.length > 0 : true);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      dispatch({
        type: "NAVIGATE",
        payload: { direction: 1, listCount: suggestions.length },
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      dispatch({
        type: "NAVIGATE",
        payload: { direction: -1, listCount: suggestions.length },
      });
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      dispatch({ type: "SELECT", payload: suggestions[activeIndex].term });
    } else if (e.key === "Escape") {
      e.preventDefault();
      dispatch({ type: "CLOSE" });
    }
  };

  return (
    <div className="relative">
      <SearchBar
        value={query}
        placeholder="Look up definitions…"
        onChange={(e) => dispatch({ type: "TYPE", payload: e.target.value })}
        onFocus={() => dispatch({ type: "FOCUS" })}
        onBlur={() => dispatch({ type: "BLUR" })}
        onKeyDown={handleKeyDown}
      />

      {showSuggestions && (
        <SuggestionList
          entries={suggestions}
          highlightedIndex={activeIndex}
          onSuggestionClick={(entry) =>
            dispatch({ type: "SELECT", payload: entry.term })
          }
          onSuggestionHover={(index) =>
            dispatch({ type: "HIGHLIGHT", payload: index })
          }
          onSuggestionHoverEnd={() =>
            dispatch({ type: "HIGHLIGHT", payload: -1 })
          }
        />
      )}
    </div>
  );
}
