/**
 * Middleware that ensures the current request has an active organization.
 *
 * This middleware **must be chained after `authMiddleware`** because it
 * depends on `context.session` and `context.user` being present.
 *
 * The `activeOrganizationId` is injected at runtime by the organization
 * plugin. Since authentication has already been handled, there is no
 * need to check if the session exists — that is guaranteed by the auth layer.
 */

import { ORPCError, os } from '@orpc/server';

import type { OrganizationAuthenticatedContext } from '../handlers/context';

export const organizationMiddleware = os
  .$context<OrganizationAuthenticatedContext>()
  .middleware(async ({ context, next }) => {
    // Auth middleware guarantees session exists
    const activeOrganizationId = context.session.activeOrganizationId;

    if (!activeOrganizationId) {
      throw new ORPCError('FORBIDDEN', {
        message: 'No active restaurant selected',
      });
    }

    return next({
      context: {
        ...context,
        // organization: {},
      },
    });
  });
