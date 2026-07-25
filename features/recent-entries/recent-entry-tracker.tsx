'use client';

import { useEffect } from 'react';

import type { Headword } from '@/lib/schemas';

import { useRecentEntries } from './use-recent-entries';

export function RecentEntryTracker({ entry }: { entry: Headword }) {
  const { addRecentEntry } = useRecentEntries();

  useEffect(() => {
    addRecentEntry(entry);
  }, [addRecentEntry, entry]);

  return null;
}
