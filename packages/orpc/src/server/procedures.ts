/**
 * A Procedure is a reusable route handler template.
 *
 * They encapsulate shared logic—authentication, context setup, middlewares
 * so individual routes stay focused on business logic.
 *
 * Each procedure defines:
 * - What context is available to the handler
 * - What middleware runs before the handler executes
 * - What guarantees the handler can rely on
 *
 * @see: https://orpc.dev/docs/advanced/exceeds-the-maximum-length-problem
 */

import { implement } from '@orpc/server';

import { authMiddleware, organizationMiddleware } from './middlewares';
import { appContract } from '../contracts';

import type { ORPCContext } from './handlers/context';

const base = implement(appContract);

export const publicProcedure = base.$context<ORPCContext>();

export const authProcedure = publicProcedure.use(authMiddleware);

export const organizationProcedure = authProcedure.use(organizationMiddleware);
