import { ChevronRightIcon } from "@radix-ui/react-icons";

function SuggestionItem({
  entry,
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
        onClick={() => onClick(entry)}
        onMouseEnter={() => onHover(index)}
        onMouseLeave={() => onHoverEnd()}
        className={`btn flex h-10 w-full items-center justify-between gap-1 rounded-xl px-4 text-left ${
          isHighlighted && "bg-(--bg-2-hover)"
        }`}
      >
        <div className="text-ui-sm">
          <span>{entry.term}</span>
          <span className="px-1 text-(--text-10)">⋅</span>
          <span className="text-(--text-10)">{entry.definition}</span>
        </div>
        <div>
          <Icon className="icon-sm text-(--text-10)"></Icon>
        </div>
      </button>
    </li>
  );
}

export default function SuggestionList({
  entries,
  highlightedIndex,
  onSuggestionClick,
  onSuggestionHover,
  onSuggestionHoverEnd,
}) {
  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      className="absolute mt-4 w-full bg-transparent"
    >
      <ul>
        {entries.map((entry, index) => (
          <SuggestionItem
            key={entry.term}
            entry={entry}
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
