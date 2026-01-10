'use client';

import { useState } from 'react';
import type { Headword } from '@/lib/types';
import { TabBar } from './TabBar';
import { EtymonSection } from './EtymonSection';

interface EntryContentProps {
  headword: Headword;
}

export function EntryContent({ headword }: EntryContentProps) {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'thesaurus'>('dictionary');

  return (
    <div className="h-full flex flex-col bg-white">
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto p-8">
        {headword.etymons.map((etymon) => (
          <EtymonSection key={etymon.id} etymon={etymon} mode={activeTab} />
        ))}
      </div>
    </div>
  );
}
