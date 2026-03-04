import { drizzle } from 'drizzle-orm/node-postgres';

import env from './lib/env';
import * as schema from './schemas';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface DatabaseClientOptions {
  databaseUrl?: string;
}

export const createDb = (opts?: DatabaseClientOptions): DatabaseInstance => {
  const databaseUrl = opts?.databaseUrl ?? env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  return drizzle({
    connection: databaseUrl,
    schema,
    logger: false,
  });
};

export type DatabaseInstance = NodePgDatabase<typeof schema>;

export type TransactionInstance = Parameters<
  Parameters<DatabaseInstance['transaction']>[0]
>[0];

export type DatabaseOrTransaction = DatabaseInstance | TransactionInstance;
