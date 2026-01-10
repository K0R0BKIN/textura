import type { Lexeme } from '@/lib/types';
import { SenseItem } from './SenseItem';

interface LexemeSectionProps {
  lexeme: Lexeme;
  mode: 'dictionary' | 'thesaurus';
}

export function LexemeSection({ lexeme, mode }: LexemeSectionProps) {
  return (
    <div id={lexeme.id} className="scroll-mt-20 mb-8">
      {/* Part of speech header */}
      <div className="mb-4 pb-2 border-b border-border-subtle">
        <h3 className="font-sans text-sm text-text-secondary">
          <span className="font-medium">{lexeme.partOfSpeech}</span>
          {lexeme.inflections && (
            <span className="ml-2">• {lexeme.inflections}</span>
          )}
        </h3>
      </div>

      {/* Senses */}
      <div className="space-y-2">
        {lexeme.senses.map((sense, index) => (
          <SenseItem
            key={sense.id}
            sense={sense}
            index={index}
            mode={mode}
          />
        ))}
      </div>
    </div>
  );
}
