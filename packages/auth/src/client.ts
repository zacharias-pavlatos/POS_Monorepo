import { organizationClient } from 'better-auth/client/plugins';
import { createAuthClient as createBetterAuthClient } from 'better-auth/react';

export interface AuthClientOptions {
  basePath: string;
  baseURL: string;
}

export const createAuthClient = ({ baseURL, basePath }: AuthClientOptions) =>
  createBetterAuthClient({
    baseURL,
    basePath,
    plugins: [organizationClient()],
    credentials: 'include',
  });
