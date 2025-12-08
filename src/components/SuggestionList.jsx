import { ChevronRightIcon } from "@radix-ui/react-icons";

function SuggestionItem({
  suggestion,
  index,
  icon: Icon = ChevronRightIcon,
  isHighlighted,
  onClick,
  onHover,
  onHoverEnd,
}) {
  return (
    <li>
      <button
        onClick={() => onClick(suggestion)}
        onMouseEnter={() => onHover(index)}
        onMouseLeave={() => onHoverEnd()}
        className={`btn flex h-10 w-full items-center justify-between rounded-xl px-4 text-left ${
          isHighlighted && "bg-(--bg-2-hover)"
        }`}
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
  highlightedIndex,
  onSuggestionClick,
  onSuggestionHover,
  onSuggestionHoverEnd,
}) {
  return (
    <div className="absolute mt-4 w-full bg-transparent">
      <ul>
        {suggestions.map((suggestion, index) => (
          <SuggestionItem
            key={suggestion.word}
            suggestion={suggestion}
            index={index}
            isHighlighted={index === highlightedIndex}
            onClick={onSuggestionClick}
            onHover={onSuggestionHover}
            onHoverEnd={onSuggestionHoverEnd}
          />
        ))}
      </ul>
    </div>
  );
}
