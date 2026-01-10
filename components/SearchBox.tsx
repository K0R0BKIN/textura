'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBoxProps {
  variant?: 'landing' | 'topbar';
  initialQuery?: string;
  autoFocus?: boolean;
}

export function SearchBox({
  variant = 'landing',
  initialQuery = '',
  autoFocus = false,
}: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [words, setWords] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/words.json')
      .then((res) => res.json())
      .then((data) => setWords(data))
      .catch((err) => console.error('Failed to load words:', err));
  }, []);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);

    if (value.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = words
      .filter((word) => word.toLowerCase().startsWith(value.toLowerCase()))
      .slice(0, 10);

    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const selectedWord =
        selectedIndex >= 0 ? suggestions[selectedIndex] : query.trim();
      if (selectedWord) {
        navigate(selectedWord);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const navigate = (word: string) => {
    setShowSuggestions(false);
    setQuery(word);
    router.push(`/word/${encodeURIComponent(word.toLowerCase())}`);
  };

  const handleSuggestionClick = (word: string) => {
    navigate(word);
  };

  const isLanding = variant === 'landing';

  return (
    <div className={`relative ${isLanding ? 'w-full max-w-2xl' : 'flex-1'}`}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query && suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="Search for a word..."
        className={`
          w-full px-6 py-3 rounded-lg border border-border-subtle
          bg-white text-text-primary font-sans
          focus:outline-none focus:ring-2 focus:ring-accent/30
          transition-all
          ${isLanding ? 'text-xl' : 'text-base'}
        `}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border-subtle rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
          {suggestions.map((word, index) => (
            <button
              key={word}
              onClick={() => handleSuggestionClick(word)}
              className={`
                w-full px-6 py-3 text-left font-sans text-text-primary
                hover:bg-accent/5 transition-colors
                ${index === selectedIndex ? 'bg-accent/10' : ''}
                ${index === 0 ? 'rounded-t-lg' : ''}
                ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''}
              `}
            >
              {word}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
