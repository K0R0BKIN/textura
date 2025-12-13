import { ChevronRightIcon } from '@radix-ui/react-icons';
import { type SuggestionEntryWithStatus } from '@/types';

interface SuggestionItemProps {
  entry: SuggestionEntryWithStatus;
  icon?: React.ComponentType<{ className?: string }>;
  isHighlighted: boolean;
  buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
}

function SuggestionItem({
  entry,
  isHighlighted,
  buttonProps,
  icon: Icon = ChevronRightIcon,
}: SuggestionItemProps) {
  const { className, ...restButtonProps } = buttonProps;

  return (
    <li>
      <button
        {...restButtonProps}
        type="button"
        className={`btn flex h-10 w-full items-center justify-between gap-1 rounded-xl px-4 text-left ${
          isHighlighted ? 'bg-(--bg-2-hover)' : ''
        } ${className ?? ''}`}
      >
        <div className="text-ui-sm flex min-w-0 flex-1 items-baseline">
          <span>{entry.term}</span>
          <span className="px-1 text-(--text-10)">·</span>
          {entry.definitionStatus === 'loading' ? (
            <span className="min-w-0 flex-1">
              <span className="block h-3 max-w-[10rem] animate-pulse rounded-full bg-(--bg-2-hover) opacity-60"></span>
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate leading-normal text-(--text-10)">
              {entry.definition}
            </span>
          )}
        </div>

        <div className="flex-shrink-0">
          <Icon className="icon-sm text-(--text-10)"></Icon>
        </div>
      </button>
    </li>
  );
}

interface SuggestionListProps {
  entries: SuggestionEntryWithStatus[];
  highlightedIndex: number;
  isOpen: boolean;
  menuProps: React.HTMLAttributes<HTMLUListElement>;
  getItemProps: (options: {
    item: SuggestionEntryWithStatus;
    index: number;
  }) => React.ButtonHTMLAttributes<HTMLButtonElement>;
}

export default function SuggestionList({
  entries,
  highlightedIndex,
  isOpen,
  menuProps,
  getItemProps,
}: SuggestionListProps) {
  const { className, ...restMenuProps } = menuProps;

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      className={`absolute mt-4 w-full bg-transparent ${isOpen ? '' : 'hidden'}`}
    >
      <ul {...restMenuProps} className={className}>
        {entries.map((entry, index) => (
          <SuggestionItem
            key={entry.term}
            entry={entry}
            isHighlighted={index === highlightedIndex}
            buttonProps={getItemProps({ item: entry, index })}
          />
        ))}
      </ul>
    </div>
  );
}
