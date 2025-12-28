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
 */

import { betterAuth } from 'better-auth';

import { createDb } from '@repo/db/client';

import { getBaseOptions } from './server';

export const auth = betterAuth({
  ...getBaseOptions(createDb()),
});
