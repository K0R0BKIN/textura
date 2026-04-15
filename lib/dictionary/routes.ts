import type { Route } from 'next';
import { slugToVariety, type Variety } from '@/lib/schemas/variety';

export function dictionaryPath(
  headword: string,
  variety: Variety,
): Route {
  return `/dictionary/${slugToVariety.encode(variety)}/${encodeURIComponent(headword)}` as Route;
}
