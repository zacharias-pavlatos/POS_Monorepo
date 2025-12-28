import type { AuthInstance } from '@repo/auth/server';
import type { DatabaseInstance } from '@repo/db/client';

import { apiHandler } from './api';
import { createORPCContext } from './context';

interface CreateApiConfig {
  /** Database instance for data access */
  db: DatabaseInstance;
  /** Authentication instance for session management */
  auth: AuthInstance;
  /** API route prefix (e.g., '/api'). Optional if routes match without it. */
  apiPath?: `/${string}`;
}

export const createApi = ({ auth, db, apiPath }: CreateApiConfig) => {
  return {
    handler: async (request: Request) => {
      return apiHandler.handle(request, {
        ...(apiPath && { prefix: apiPath }),
        context: await createORPCContext({
          db,
          auth,
          headers: request.headers,
        }),
      });
    },
  };
};
