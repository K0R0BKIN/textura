'use client';

import { useCallback } from 'react';
import useLocalStorageState from 'use-local-storage-state';
import { z } from 'zod';

import { HeadwordSchema, type Headword } from '@/lib/schemas';

const MAX_RECENT_ENTRIES = 5;
const STORAGE_KEY = 'textura:recent-entries:v1';

const RecentEntriesSchema = z.array(HeadwordSchema);

const serializer = {
  stringify(value: unknown) {
    return JSON.stringify(value);
  },
  parse(value: string) {
    return RecentEntriesSchema.parse(JSON.parse(value));
  },
};

export function useRecentEntries() {
  const [recentEntries, setRecentEntries] = useLocalStorageState<Headword[]>(
    STORAGE_KEY,
    {
      defaultValue: [],
      serializer,
    },
  );

  const addRecentEntry = useCallback(
    (entry: Headword) => {
      setRecentEntries((recentEntries) =>
        [
          entry,
          ...recentEntries.filter(
            (existingEntry) =>
              existingEntry.form !== entry.form ||
              existingEntry.variety !== entry.variety,
          ),
        ].slice(0, MAX_RECENT_ENTRIES),
      );
    },
    [setRecentEntries],
  );

  return {
    recentEntries,
    addRecentEntry,
  };
}
