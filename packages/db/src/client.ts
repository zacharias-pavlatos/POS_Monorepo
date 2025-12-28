import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import env from './lib/env';
import * as schema from './schemas';

import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

export interface DatabaseClientOptions {
  databaseUrl?: string;
}

export const createDb = (opts?: DatabaseClientOptions) => {
  const databaseUrl = opts?.databaseUrl ?? env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const connection = neon(databaseUrl);

  return drizzle({
    schema,
    client: connection,
    logger: false,
  });
};

export type DatabaseInstance = NeonHttpDatabase<typeof schema>;
