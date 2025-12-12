import { ChevronRightIcon } from '@radix-ui/react-icons';
import { type SuggestionEntry } from '../types';

interface SuggestionItemProps {
  entry: SuggestionEntry;
  index: number;
  icon?: React.ComponentType<{ className?: string }>;
  isHighlighted: boolean;
  onClick: (entry: SuggestionEntry) => void;
  onHover: (index: number) => void;
  onHoverEnd: () => void;
}

function SuggestionItem({
  entry,
  index,
  isHighlighted,
  onClick,
  onHover,
  onHoverEnd,
  icon: Icon = ChevronRightIcon,
}: SuggestionItemProps) {
  return (
    <li>
      <button
        onClick={() => onClick(entry)}
        onMouseEnter={() => onHover(index)}
        onMouseLeave={() => onHoverEnd()}
        className={`btn flex h-10 w-full items-center justify-between gap-1 rounded-xl px-4 text-left ${
          isHighlighted && 'bg-(--bg-2-hover)'
        }`}
      >
        <div className="text-ui-sm">
          <span>{entry.term}</span>
          <span className="px-1 text-(--text-10)">·</span>
          <span className="text-(--text-10)">{entry.definition}</span>
        </div>
        <div>
          <Icon className="icon-sm text-(--text-10)"></Icon>
        </div>
      </button>
    </li>
  );
}

interface SuggestionListProps {
  entries: SuggestionEntry[];
  highlightedIndex: number | null;
  onSuggestionClick: (entry: SuggestionEntry) => void;
  onSuggestionHover: (index: number) => void;
  onSuggestionHoverEnd: () => void;
}

export default function SuggestionList({
  entries,
  highlightedIndex,
  onSuggestionClick,
  onSuggestionHover,
  onSuggestionHoverEnd,
}: SuggestionListProps) {
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
