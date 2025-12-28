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

import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_SERVER_URL: z.string().min(1, 'SERVER_URL is required'),
  NEXT_PUBLIC_CLIENT_URL: z.string().min(1, 'CLIENT_URL is required'),
});

// eslint-disable-next-line no-restricted-syntax
const result = EnvSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
  NEXT_PUBLIC_CLIENT_URL: process.env.NEXT_PUBLIC_CLIENT_URL,
});

if (!result.success) {
  const treeErrors = z.treeifyError(result.error).properties;
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
export const env: Env = result.data;
