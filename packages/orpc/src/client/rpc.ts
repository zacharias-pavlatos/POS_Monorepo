import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';

import type { appContract } from '../contracts';
import type { ContractRouterClient } from '@orpc/contract';

export interface RPCClientOptions {
  url: string;
  headers?: () =>
    | Promise<Record<string, string> | Headers>
    | Record<string, string>
    | Headers;
}

export const createRPCClient = ({ url, headers }: RPCClientOptions) => {
  const link = new RPCLink({
    url,
    headers,
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

export const createTanstackQueryRPCClient = (opts: RPCClientOptions) => {
  const rpcClient = createRPCClient(opts);
  return createTanstackQueryUtils(rpcClient);
};
