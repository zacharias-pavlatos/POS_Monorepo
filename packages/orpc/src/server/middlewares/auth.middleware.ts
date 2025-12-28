import { ORPCError, os } from '@orpc/server';

import type { AuthenticatedContext, ORPCContext } from '../handlers/context';

export const authMiddleware = os
  .$context<ORPCContext>()
  .middleware(async ({ context, next }) => {
    // Get the session from the request headers
    const sessionData = await context.auth.api.getSession({ headers: context.headers });

    if (!sessionData) {
      throw new ORPCError('UNAUTHORIZED');
    }

    return next({
      context: {
        ...context,
        user: sessionData.user,
        session: sessionData.session,
      } satisfies AuthenticatedContext,
    });
  });
