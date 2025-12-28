import { createApi } from '@repo/orpc/server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const api = createApi({
  db,
  auth,
  /**
   * Must match the Hono mount path (e.g., if Hono mounts at `/api/*`, set this to `/api`).
   * This is necessary because the raw Request URL contains the full path (`/api/categories`),
   * but the contract defines routes without the prefix (`/categories`).
   * It need to know what to strip in order to much.
   */
  apiPath: '/api',
});
