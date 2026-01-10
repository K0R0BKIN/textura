'use client';

import { useState } from 'react';
import type { Etymon } from '@/lib/types';
import { LexemeSection } from './LexemeSection';

interface EtymonSectionProps {
  etymon: Etymon;
  mode: 'dictionary' | 'thesaurus';
}

export function EtymonSection({ etymon, mode }: EtymonSectionProps) {
  const [audioError, setAudioError] = useState(false);

  const playAudio = () => {
    if (!etymon.audioUrl || audioError) return;

    try {
      const audio = new Audio(etymon.audioUrl);
      audio.play().catch((err) => {
        console.error('Audio playback failed:', err);
        setAudioError(true);
      });
    } catch (err) {
      console.error('Audio creation failed:', err);
      setAudioError(true);
    }
  };

  return (
    <div className="mb-12">
      {/* Etymon header */}
      <div className="mb-8">
        <div className="flex items-baseline gap-4 flex-wrap">
          <h2 className="font-serif text-4xl text-text-primary">
            {etymon.label}
          </h2>
          {etymon.phonetic && (
            <span className="font-mono text-lg text-text-secondary/60">
              {etymon.phonetic}
            </span>
          )}
          {etymon.audioUrl && !audioError && (
            <button
              onClick={playAudio}
              className="text-accent hover:text-accent/80 transition-colors text-xl"
              title="Play pronunciation"
            >
              🔊
            </button>
          )}
        </div>

        {etymon.origin && (
          <p className="mt-3 font-serif text-sm text-text-secondary italic leading-relaxed">
            Origin: {etymon.origin}
          </p>
        )}
      </div>

      {/* Lexemes */}
      <div>
        {etymon.lexemes.map((lexeme) => (
          <LexemeSection key={lexeme.id} lexeme={lexeme} mode={mode} />
        ))}
      </div>
    </div>
  );
}
