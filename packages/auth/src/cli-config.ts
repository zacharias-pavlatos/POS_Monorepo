/**
 * @internal
 *
 * This export is needed strictly for the CLI to work with
 *     pnpm auth:schema:generate
 *
 * It should not be imported or used for any other purpose.
 *
 * The documentation for better-auth CLI can be found here:
 * @see https://www.better-auth.com/docs/concepts/cli
 *
 * TO GENERATE SCHEMA FROM BETTER-AUTH - CLI
 * RUN : npx @better-auth/cli generate --config ./src/cli-config.ts
 * AT AUTH PACKAGE
 *
 */

import { betterAuth } from 'better-auth';

import { createDb } from '@repo/db/client';

import { type AuthInstance, getBaseOptions } from './server';

export const auth: AuthInstance = betterAuth({
  ...getBaseOptions(createDb(), true),
});
