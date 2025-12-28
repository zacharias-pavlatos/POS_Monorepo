import { createRpc } from '@repo/orpc/server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export const rpc = createRpc({
  db,
  auth,
  /**
   * Must match the Hono mount path (e.g., if Hono mounts at `/rpc/*`, set this to `/rpc`).
   * This is necessary because the raw Request URL contains the full path (`/rpc/categories`),
   * but the contract defines routes without the prefix (`/categories`).
   * It need to know what to strip in order to much.
   */
  rpcPath: '/rpc',
});
