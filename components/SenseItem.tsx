'use client';

import { useRouter } from 'next/navigation';
import type { Sense } from '@/lib/types';

interface SenseItemProps {
  sense: Sense;
  index: number;
  mode: 'dictionary' | 'thesaurus';
}

export function SenseItem({ sense, index, mode }: SenseItemProps) {
  const router = useRouter();

  const handleSynonymClick = (word: string) => {
    router.push(`/word/${encodeURIComponent(word.toLowerCase())}`);
  };

  const hasSynonyms = sense.synonyms && sense.synonyms.length > 0;
  const hasAntonyms = sense.antonyms && sense.antonyms.length > 0;

  return (
    <div className="py-3 border-b border-border-subtle/50 last:border-0">
      <div className="flex items-start gap-3">
        <span className="font-serif text-text-secondary shrink-0">
          {index + 1}.
        </span>
        <div className="flex-1 min-w-0">
          {/* Definition with tags */}
          <div className="flex items-start gap-2 flex-wrap">
            {sense.tags && sense.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {sense.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-0.5 rounded text-xs font-sans bg-accent/10 text-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="font-serif text-text-primary leading-relaxed">
              {sense.definition}
            </p>
          </div>

          {/* Examples (dictionary mode) */}
          {mode === 'dictionary' && sense.examples && sense.examples.length > 0 && (
            <div className="mt-2 space-y-1">
              {sense.examples.map((example, idx) => (
                <p
                  key={idx}
                  className="font-serif text-text-secondary italic text-sm pl-4 border-l-2 border-accent/20"
                >
                  "{example}"
                </p>
              ))}
            </div>
          )}

          {/* Synonyms & Antonyms (thesaurus mode) */}
          {mode === 'thesaurus' && (hasSynonyms || hasAntonyms) && (
            <div className="mt-3 space-y-2">
              {hasSynonyms && (
                <div>
                  <span className="font-sans text-xs text-text-secondary uppercase tracking-wide mr-2">
                    Synonyms:
                  </span>
                  <div className="inline-flex flex-wrap gap-2 mt-1">
                    {sense.synonyms!.map((synonym) => (
                      <button
                        key={synonym}
                        onClick={() => handleSynonymClick(synonym)}
                        className="px-3 py-1 rounded-full bg-accent/10 text-accent font-sans text-sm hover:bg-accent/20 transition-colors"
                      >
                        {synonym}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasAntonyms && (
                <div>
                  <span className="font-sans text-xs text-text-secondary uppercase tracking-wide mr-2">
                    Antonyms:
                  </span>
                  <div className="inline-flex flex-wrap gap-2 mt-1">
                    {sense.antonyms!.map((antonym) => (
                      <button
                        key={antonym}
                        onClick={() => handleSynonymClick(antonym)}
                        className="px-3 py-1 rounded-full bg-text-secondary/10 text-text-secondary font-sans text-sm hover:bg-text-secondary/20 transition-colors"
                      >
                        {antonym}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chevron (visual only for Phase 1) */}
        <span className="text-text-secondary/30 shrink-0 text-xl">→</span>
      </div>
    </div>
  );
}
