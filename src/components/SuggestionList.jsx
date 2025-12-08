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

function SuggestionItem({ suggestion, onClick }) {
  return (
    <li>
      <button
        onClick={() => onClick(suggestion)}
        className="text-ui btn h-10 w-full rounded-xl px-4 text-left hover:bg-(--bg-2-hover)"
      >
        {suggestion}
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
