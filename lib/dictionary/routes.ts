import type { Route } from 'next';

export function dictionaryPath(query: string): Route {
  return `/dictionary/${encodeURIComponent(query)}/en-us` as Route;
}
