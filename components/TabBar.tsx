'use client';

interface TabBarProps {
  activeTab: 'dictionary' | 'thesaurus';
  onTabChange: (tab: 'dictionary' | 'thesaurus') => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="sticky top-0 bg-bg-primary border-b border-border-subtle z-10">
      <div className="flex gap-1 p-2">
        <button
          onClick={() => onTabChange('dictionary')}
          className={`
            px-6 py-2 rounded font-sans text-sm font-medium transition-colors
            ${
              activeTab === 'dictionary'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-accent/5'
            }
          `}
        >
          Dictionary
        </button>
        <button
          onClick={() => onTabChange('thesaurus')}
          className={`
            px-6 py-2 rounded font-sans text-sm font-medium transition-colors
            ${
              activeTab === 'thesaurus'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-accent/5'
            }
          `}
        >
          Thesaurus
        </button>
      </div>
    </div>
  );
}
