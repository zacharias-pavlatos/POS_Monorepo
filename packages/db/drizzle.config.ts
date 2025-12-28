/**
 * Drizzle Kit configuration for database schema management and migrations.
 *
 * This configuration file sets up Drizzle ORM's code generation and migration tools
 * for a PostgreSQL database. It defines how schema changes are detected, validated,
 * and migrated to maintain database integrity.
 */

import { defineConfig } from 'drizzle-kit';

import env from './src/lib/env';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  // @see https://orm.drizzle.team/docs/drizzle-config-file#strict
  strict: true,
  verbose: true,
});
