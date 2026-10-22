import 'server-only';

import { algoliasearch } from 'algoliasearch';

export const writeClient = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_WRITE_API_KEY!,
);
