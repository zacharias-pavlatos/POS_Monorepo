/**
 * Database connection for CLI tooling (seeds, migrations, etc).
 *
 * These scripts run outside the app and don't have access to injected
 * dependencies, so they create their own connection. Runtime app code
 * uses the factory pattern instead.
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import env from '@/lib/env';

import * as schema from '../schemas';

console.log('DATABASE_URL->', env.DATABASE_URL);
export const db = drizzle(neon(env.DATABASE_URL!), { schema });
