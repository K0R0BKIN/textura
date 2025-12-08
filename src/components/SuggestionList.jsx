import { ChevronRightIcon } from "@radix-ui/react-icons";

const SUGGESTIONS = [
  "Serendipity",
  "Eloquent",
  "Mellifluous",
  "Ephemeral",
  "Ubiquitous",
  "Pragmatic",
  "Aesthetic",
  "Nostalgia",
  "Resilient",
  "Ambiguous",
];

function SuggestionItem({
  suggestion,
  icon: Icon = ChevronRightIcon,
  onClick,
}) {
  return (
    <li>
      <button
        onClick={() => onClick(suggestion)}
        className="btn flex h-10 w-full items-center justify-between rounded-xl px-4 text-left hover:bg-(--bg-2-hover)"
      >
        <div className="text-ui-sm">{suggestion}</div>
        <div>
          <Icon className="icon-sm text-(--text-10)"></Icon>
        </div>
      </button>
    </li>
  );
}

export default function SuggestionList({
  suggestions = SUGGESTIONS,
  onSuggestionClick,
}) {
  return (
    <div className="absolute mt-4 w-full bg-transparent">
      <ul className="flex flex-col gap-0.5">
        {suggestions.map((suggestion) => (
          <SuggestionItem
            key={suggestion}
            suggestion={suggestion}
            onClick={onSuggestionClick}
          />
        ))}
      </ul>
    </div>
  );
}
