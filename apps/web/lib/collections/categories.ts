import { createQueryCollection } from '@tanstack/db-collections';
import { rpcClient } from '../rpc-client';

export const categoriesCollection = createQueryCollection<Category>({
  queryKey: ['categories'],
  queryFn: () => rpcClient.categories.all(),
  getId: item => item.id,
  schema: categorySchema,
});
