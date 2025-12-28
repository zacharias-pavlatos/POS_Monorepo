/**
 * Builds the base context available to all oRPC procedures and middleware.
 *
 * Everything returned here is accessible via `context` in every route handler.
 *
 * Used to inject dependencies (`db`, `auth`) rather than importing them
 * directly. This keeps the oRPC package decoupled and only aware of their types.
 * This is the entry point of the orpc
 *
 * Avoid expensive operations here since they run on every request. Use middleware
 * for auth checks or queries that only specific routes need.
 */

import type { AuthInstance } from '@repo/auth/server';
import type { DatabaseInstance } from '@repo/db/client';

export interface ORPCContext {
  db: DatabaseInstance;
  auth: AuthInstance;
  headers: Headers;
}
// Derived from AuthInstance
export type AuthSession = NonNullable<
  Awaited<ReturnType<AuthInstance['api']['getSession']>>
>;
// Auth middleware guarantee
export interface AuthenticatedContext extends ORPCContext {
  session: AuthSession['session'];
  user: AuthSession['user'];
}
/**
 * The organization plugin injects `activeOrganizationId` into the session
 * at runtime not before. Therefore this type extension informs TypeScript of its presence,
 * enabling middleware and handlers to safely access the current organization.
 */
export interface OrganizationAuthenticatedContext extends AuthenticatedContext {
  session: AuthenticatedContext['session'] & {
    activeOrganizationId?: string;
  };
}

export const createORPCContext = async ({ db, auth, headers }: ORPCContext) => {
  return { db, auth, headers };
};
