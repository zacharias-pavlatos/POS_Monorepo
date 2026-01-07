import { apiClient } from '@/lib/api-client';
import { rpcClient } from '@/lib/rpc-client';

export default async function CategoriesPage() {
  const categories = await rpcClient.categories.all();
  console.log(JSON.stringify(categories, null, 2));

  return (
    <div>
      Categories
      <div>
        {categories.map(category => {
          return <div key={category.id}>{category.name}</div>;
        })}
      </div>
    </div>
  );
}
