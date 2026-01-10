'use client';

import { useState } from 'react';
import type { Headword } from '@/lib/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface TOCProps {
  headword: Headword;
  onLexemeClick?: (lexemeId: string) => void;
}

export function TOC({ headword, onLexemeClick }: TOCProps) {
  const [expandedEtymons, setExpandedEtymons] = useState<Set<string>>(
    new Set([headword.etymons[0]?.id])
  );
  const [favorites, setFavorites] = useLocalStorage<Record<string, boolean>>(
    'textura_favorites',
    {}
  );

  const toggleEtymon = (etymonId: string) => {
    setExpandedEtymons((prev) => {
      const next = new Set(prev);
      if (next.has(etymonId)) {
        next.delete(etymonId);
      } else {
        next.add(etymonId);
      }
      return next;
    });
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const key = `${headword.term}_${headword.language}`;
    setFavorites((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const scrollToLexeme = (lexemeId: string) => {
    const element = document.getElementById(lexemeId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    onLexemeClick?.(lexemeId);
  };

  const favoriteKey = `${headword.term}_${headword.language}`;
  const isFavorited = favorites[favoriteKey] || false;

  return (
    <div className="h-full border-r border-border-subtle bg-white/50 p-4 overflow-y-auto">
      {/* Headword section */}
      <div className="mb-6 group">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-serif text-2xl text-text-primary truncate">
              {headword.term}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="font-sans text-xs text-text-secondary uppercase">
                {headword.language}
              </div>
              <button
                onClick={toggleFavorite}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <span className="text-accent text-sm">
                  {isFavorited ? '★' : '☆'}
                </span>
              </button>
            </div>
          </div>
        </div>
        <div className="font-sans text-sm text-text-secondary mt-2">
          {headword.summary}
        </div>
      </div>

      {/* Etymons & Lexemes */}
      <div className="space-y-2">
        {headword.etymons.map((etymon) => {
          const isExpanded = expandedEtymons.has(etymon.id);

          return (
            <div key={etymon.id}>
              <button
                onClick={() => toggleEtymon(etymon.id)}
                className="w-full text-left font-serif text-lg text-text-primary hover:text-accent transition-colors flex items-center gap-2"
              >
                <span className="text-sm">{isExpanded ? '▼' : '▶'}</span>
                {etymon.label}
              </button>

              {isExpanded && (
                <div className="ml-6 mt-2 space-y-1">
                  {etymon.lexemes.map((lexeme) => (
                    <button
                      key={lexeme.id}
                      onClick={() => scrollToLexeme(lexeme.id)}
                      className="block w-full text-left font-sans text-sm text-text-secondary hover:text-accent transition-colors py-1 px-2 rounded hover:bg-accent/5"
                    >
                      {lexeme.partOfSpeech}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
