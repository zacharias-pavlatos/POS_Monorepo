/**
 * RPC Factory for type-safe client-server communication
 *
 * Unlike the REST API handler, this exposes procedures directly by name
 * without HTTP method/path mapping. Ideal for internal frontend-to-backend
 * calls where you want end-to-end type inference.
 */

import type { AuthInstance } from '@repo/auth/server';
import type { DatabaseInstance } from '@repo/db/client';

import { createORPCContext } from './context';
import { rpcHandler } from './rpc';

interface CreateRpcConfig {
  /** Database instance for data access */
  db: DatabaseInstance;
  /** Authentication instance for session management */
  auth: AuthInstance;
  /** RPC route prefix (e.g., '/rpc'). Optional if routes match without it. */
  rpcPath?: `/${string}`;
}

export const createRpc = ({ auth, db, rpcPath }: CreateRpcConfig) => {
  return {
    handler: async (request: Request) => {
      return rpcHandler.handle(request, {
        ...(rpcPath && { prefix: rpcPath }),
        context: await createORPCContext({
          db,
          auth,
          headers: request.headers,
        }),
      });
    },
  };
};
