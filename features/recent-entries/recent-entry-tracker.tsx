'use client';

import { useEffect } from 'react';

import type { Headword } from '@/lib/schemas';
import { useRecentEntries } from './use-recent-entries';

export function RecentEntryTracker({ headword }: { headword: Headword }) {
  const { addRecentEntry } = useRecentEntries();

  useEffect(() => {
    addRecentEntry(headword);
  }, [addRecentEntry, headword]);

  return null;
}
