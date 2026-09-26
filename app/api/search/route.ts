import { searchHeadwords } from '@/lib/headwords';
import { cacheHeaders } from '@/lib/http';
import {
  isSearchableQuery,
  normalizeSearchQuery,
} from '@/lib/search/headwords';

export async function GET(request: Request) {
  const query = normalizeSearchQuery(
    new URL(request.url).searchParams.get('q') ?? '',
  );

  if (!isSearchableQuery(query)) {
    return Response.json([], { headers: cacheHeaders });
  }

  return Response.json(await searchHeadwords(query), {
    headers: cacheHeaders,
  });
}
