import { ChevronRightIcon } from "@radix-ui/react-icons";

function SuggestionItem({
  suggestion,
  icon: Icon = ChevronRightIcon,
  isHighlighted,
  onClick,
}) {
  return (
    <li>
      <button
        onClick={() => onClick(suggestion)}
        className={`btn flex h-10 w-full items-center justify-between rounded-xl px-4 text-left hover:bg-(--bg-2-hover) ${isHighlighted ? "bg-(--bg-2-hover)" : ""}`}
      >
        <div className="text-ui-sm">
          <span>{suggestion.word}</span>
          <span className="px-1 text-(--text-10)">⋅</span>
          <span className="text-(--text-10)">{suggestion.definition}</span>
        </div>
        <div>
          <Icon className="icon-sm text-(--text-10)"></Icon>
        </div>
      </button>
    </li>
  );
}

export default function SuggestionList({
  suggestions,
  highlightedSuggestion,
  onSuggestionClick,
}) {
  return (
    <div className="absolute mt-4 w-full bg-transparent">
      <ul>
        {suggestions.map((suggestion) => (
          <SuggestionItem
            key={suggestion.word}
            suggestion={suggestion}
            isHighlighted={suggestion.key === highlightedSuggestion}
            onClick={onSuggestionClick}
          />
        ))}
      </ul>
    </div>
  );
}
