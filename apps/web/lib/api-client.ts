import { createAPIClient, createTanstackQueryAPIClient } from '@repo/orpc/client';
import { env } from '@/env';

export const apiClient = createAPIClient({
  url: `${env.NEXT_PUBLIC_SERVER_URL}/api/`,
  headers: getHeaders,
});

export const apiQuery = createTanstackQueryAPIClient({
  url: `${env.NEXT_PUBLIC_SERVER_URL}/api/`,
  headers: getHeaders,
});

/**
 * Resolves request headers based on runtime environment.
 *
 * Browser: Empty object - cookies are automatically included via `credentials: 'include'`
 * Server: Forwards incoming request headers to enable SSR authentication
 */
async function getHeaders() {
  if (typeof window !== 'undefined') {
    return {};
  }
  const { headers } = await import('next/headers');
  return await headers();
}
