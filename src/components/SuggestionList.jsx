import { ChevronRightIcon } from "@radix-ui/react-icons";

const MAX_DEFINITION_LENGTH = 60;

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
  suggestions = SUGGESTIONS,
  onSuggestionClick,
}) {
  return (
    <div className="absolute mt-4 w-full bg-transparent">
      <ul>
        {suggestions.map((suggestion) => (
          <SuggestionItem
            key={suggestion.word}
            suggestion={suggestion}
            onClick={onSuggestionClick}
          />
        ))}
      </ul>
    </div>
  );
}
