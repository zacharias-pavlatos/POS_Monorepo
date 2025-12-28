/**
 * RPC Handler for type-safe client-server communication
 *
 * This handler:
 * - Provides direct procedure calls from frontend
 * - Maintains end-to-end type safety between client and server
 * - No REST paths needed - calls procedures by name
 */

import { onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';

import { appRouter } from '../routers';

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError(error => {
      // TODO: Add proper error logging service (e.g., Sentry, DataDog)
      console.error(error);
    }),
  ],
});
