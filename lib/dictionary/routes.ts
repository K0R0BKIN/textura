import type { Route } from 'next';

export function dictionaryPath(query: string): Route {
  return `/dictionary/en-us/${encodeURIComponent(query)}` as Route;
}
