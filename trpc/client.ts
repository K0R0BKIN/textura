import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './routers/_app';

function getUrl() {
  const base =
    typeof window !== 'undefined'
      ? ''
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';
  return `${base}/api/trpc`;
}

function createClient() {
  return createTRPCClient<AppRouter>({
    links: [httpBatchLink({ url: getUrl() })],
  });
}

let browserClient: ReturnType<typeof createClient> | undefined;

export function getTRPCClient() {
  if (typeof window === 'undefined') {
    return createClient();
  }
  return (browserClient ??= createClient());
}
