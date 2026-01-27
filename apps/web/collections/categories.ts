import { rpcClient } from '@/lib/rpc-client';
import { QueryClient, queryOptions } from '@tanstack/react-query';

import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { createCollection } from '@tanstack/db';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 3,
    },
  },
});

export const categoriesCollection = createCollection(
  queryCollectionOptions({
    queryClient,
    queryKey: ['categories'],
    getKey: item => item.id,

    queryFn: async () => {
      return await rpcClient.categories.all();
    },

    // Persist inserts
    onInsert: async ({ transaction }) => {
      const results = await Promise.all(
        transaction.mutations.map(m =>
          rpcClient.categories.create({
            name: m.modified.name,
          })
        )
      );

      return results;
    },

    // Persist updates
    onUpdate: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map(m =>
          rpcClient.categories.update({
            id: m.original.id,
            ...m.changes,
          })
        )
      );
    },

    // Persist deletes
    onDelete: async ({ transaction }) => {
      await Promise.all(
        transaction.mutations.map(m => rpcClient.categories.delete({ id: m.original.id }))
      );
    },
  })
);
