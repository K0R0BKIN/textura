'use client';

import { useState, useEffect } from 'react';
import type { Headword } from '@/lib/types';
import { fetchWordDefinition } from '@/lib/api';
import { getCached, setCached } from '@/lib/cache';

interface UseDictionaryResult {
  data: Headword | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

/**
 * Hook to fetch word definition with caching
 * Checks cache first, then API
 */
export function useDictionary(query: string | null): UseDictionaryResult {
  const [data, setData] = useState<Headword | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      setError(null);
      setNotFound(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        // Check cache first
        const normalizedQuery = query.toLowerCase().trim();
        const cached = getCached<Headword>(normalizedQuery);

        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }

        // Fetch from API
        const result = await fetchWordDefinition(query);

        if (result) {
          setData(result);
          setCached(normalizedQuery, result);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'NotFoundError') {
          setNotFound(true);
        } else {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  return { data, loading, error, notFound };
}
