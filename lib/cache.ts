/**
 * localStorage cache with TTL support
 * Max 50 entries, 24-hour expiration
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_PREFIX = 'textura_cache_';
const MAX_ENTRIES = 50;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached data if not expired
 */
export function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;

    const entry: CacheEntry<T> = JSON.parse(item);
    const now = Date.now();

    if (now - entry.timestamp > TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Store data in cache with current timestamp
 */
export function setCached<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    pruneCache();
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * Remove oldest entries if cache exceeds MAX_ENTRIES
 */
function pruneCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keys.push(key);
      }
    }

    if (keys.length <= MAX_ENTRIES) return;

    // Sort by timestamp (oldest first)
    const entries = keys
      .map((key) => {
        const item = localStorage.getItem(key);
        if (!item) return null;
        try {
          const entry = JSON.parse(item);
          return { key, timestamp: entry.timestamp };
        } catch {
          return null;
        }
      })
      .filter((e): e is { key: string; timestamp: number } => e !== null)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest entries
    const toRemove = entries.slice(0, keys.length - MAX_ENTRIES);
    toRemove.forEach((entry) => localStorage.removeItem(entry.key));
  } catch (error) {
    console.error('Cache prune error:', error);
  }
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}
