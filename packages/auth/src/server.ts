/**
 * Better Auth configuration for organization-based authentication.
 * @see https://www.better-auth.com/docs/introduction
 *
 * Initializes Better Auth with:
 * - PostgreSQL database via Drizzle adapter
 * - Organization plugin for team/workspace management
 * - OpenAPI plugin for auto-generated API documentation
 * - Email/password authentication (configurable for dev environments)
 *   we seed the user in the db. NO ui sign up form is needed
 *
 * @remarks
 * By default, Better Auth enables all core endpoints (email/password auth, social login, etc.)
 * regardless of actual configuration. This creates misleading OpenAPI docs showing endpoints that
 * don't exist in the application.
 * We explicitly disable unused endpoints to maintain an accurate API contract.
 *
 * The OpenAPI schema is generated at `/auth-schema` and available in the Scalar UI at `/scalar`.
 * Only organization and core session endpoints appear in the documentation.
 *
 * @see  https://better-auth.com/docs/plugins/organization
 * @see  https://better-auth.com/docs/plugins/open-api
 */

import { type BetterAuthOptions, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI, organization } from 'better-auth/plugins';

import type { DatabaseInstance } from '@repo/db/client';

export interface AuthOptions {
  webUrl: string;
  baseURL: string;
  authSecret: string;
  db: DatabaseInstance;
  socialProviders?: BetterAuthOptions['socialProviders'];
  enableEmailPasswordAuth: boolean;
}

export const getBaseOptions = (
  db: DatabaseInstance,
  enableEmailPasswordAuth: boolean
): BetterAuthOptions =>
  ({
    database: drizzleAdapter(db, {
      provider: 'pg',
    }),
    emailAndPassword: {
      enabled: enableEmailPasswordAuth,
    },
    plugins: [
      openAPI({
        path: '/docs',

        // Hides Better Auth's default UI at `/api/auth/reference`
        // disableDefaultReference: true,
      }),
      organization({}),
    ],
  }) satisfies BetterAuthOptions;

export const createAuth = ({
  webUrl,
  baseURL,
  db,
  authSecret,
  socialProviders,
  enableEmailPasswordAuth,
}: AuthOptions): AuthInstance => {
  return betterAuth({
    ...getBaseOptions(db, enableEmailPasswordAuth),
    baseURL,
    secret: authSecret,
    trustedOrigins: [webUrl],
    socialProviders,
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 2 * 60, // 2 minutes
      },
    },
  });
};

export type AuthInstance = ReturnType<typeof betterAuth>;
