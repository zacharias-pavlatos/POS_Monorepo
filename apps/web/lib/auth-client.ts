import { createAuthClient } from '@repo/auth/client';
import { env } from '@/env';
// import { headers } from 'next/headers';

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_SERVER_URL,
  basePath: '/auth',
});
