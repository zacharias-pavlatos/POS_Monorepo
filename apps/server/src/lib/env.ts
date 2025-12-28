/**
 * Application Environment Configuration
 *
 * Loads and validates environment variables from a `.env` file.
 * Uses Zod for runtime schema validation and type safety, ensuring all required
 * variables are present and correctly typed before the application starts.
 *
 * Note:
 * Environment variables must be accessed exclusively through the exported `env` object
 * to maintain type safety and enforce centralized validation.
 * Direct `process.env` access outside this module is prohibited.
 */

import { resolve } from 'path';

import { config } from 'dotenv';
import { z } from 'zod';
// src/server.ts

config({ path: resolve(import.meta.dirname, './../../.env') });
// rest of imports...
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().min(1, 'CLIENT_URL is required'),
  SERVER_URL: z.string().min(1, 'SERVER_URL is required'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
    .default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // 🔑 Better Auth Secrets
  BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),

  // Google
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),

  // Apple
  APPLE_CLIENT_ID: z.string().min(1, 'APPLE_CLIENT_ID is required'),
  APPLE_CLIENT_SECRET: z.string().min(1, 'APPLE_CLIENT_SECRET is required'),
  APPLE_APP_BUNDLE_IDENTIFIER: z
    .string()
    .min(1, 'APPLE_APP_BUNDLE_IDENTIFIER is required for Apple'),

  // Microsoft
  MICROSOFT_CLIENT_ID: z.string().min(1, 'MICROSOFT_CLIENT_ID is required'),
  MICROSOFT_CLIENT_SECRET: z.string().min(1, 'MICROSOFT_CLIENT_SECRET is required'),
});

// eslint-disable-next-line no-restricted-syntax
const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
  const treeErrors = z.treeifyError(error).properties;
  console.error('❌ Invalid environment variables:\n');

  Object.entries(treeErrors ?? {}).forEach(([key, value]) => {
    if (value?.errors) {
      console.error(`  ${key}`);
      value.errors.forEach(message => {
        console.error(`    └─ ${message}`);
      });
    }
  });

  process.exit(1);
}

export type Env = z.infer<typeof EnvSchema>;
export default env!;
