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
  // ✉️ Resend
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_SENDER_ADDRESS: z.string().min(1, 'EMAIL_SENDER_ADDRESS is required'),
  EMAIL_SENDER_NAME: z.string().min(1, 'EMAIL_SENDER_NAME is required'),
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
