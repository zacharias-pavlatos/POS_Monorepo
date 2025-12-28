/**
 * RPC Client Configuration
 *
 * Provides type-safe RPC clients for server communication:
 * - `rpcClient`: Direct procedure calls for Server Components and actions
 * - `rpcQuery`: TanStack Query integration for Client Components (useQuery, useMutation)
 *
 * Automatically handles authentication cookies in both browser and SSR contexts.
 */

import { createRPCClient, createTanstackQueryRPCClient } from '@repo/orpc/client';
import { env } from '@/env';

export const rpcClient = createRPCClient({
  url: `${env.NEXT_PUBLIC_SERVER_URL}/rpc`,
  headers: getHeaders,
});

export const rpcQuery = createTanstackQueryRPCClient({
  url: `${env.NEXT_PUBLIC_SERVER_URL}/rpc`,
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
  console.log(headers);
  return await headers();
}
