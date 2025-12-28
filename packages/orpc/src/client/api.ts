import { createORPCClient } from '@orpc/client';
import { ResponseValidationPlugin } from '@orpc/contract/plugins';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';

import { appContract } from '../contracts';

import type { ContractRouterClient, InferContractRouterOutputs } from '@orpc/contract';

export { isDefinedError, safe } from '@orpc/client';

export interface APIClientOptions {
  url: string;
  headers?: () =>
    | Promise<Record<string, string> | Headers>
    | Record<string, string>
    | Headers;
}

// Oddly, this is needed for better-auth to not complain
export type { AppRouter } from '../server';

export type RouterOutput = InferContractRouterOutputs<typeof appContract>;

export const createAPIClient = ({ url, headers }: APIClientOptions) => {
  const link = new OpenAPILink(appContract, {
    url,
    headers,
    /**
     * Response validation disabled: Server already validates outputs against
     * the contract before sending. Double-validating on the client is redundant
     * when you own both sides and share the same contract.
     */
    // plugins: [new ResponseValidationPlugin(appContract)],
    fetch: (request, init) => {
      return globalThis.fetch(request, {
        ...init,
        credentials: 'include',
      });
    },
  });
  const client: ContractRouterClient<typeof appContract> = createORPCClient(link);

  return client;
};

export const createTanstackQueryAPIClient = (opts: APIClientOptions) => {
  const apiClient = createAPIClient(opts);
  return createTanstackQueryUtils(apiClient);
};
