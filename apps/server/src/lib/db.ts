import { createDb } from '@repo/db/client';

import env from '@/lib/env';

// Create singleton in server
export const db = createDb({ databaseUrl: env.DATABASE_URL });
