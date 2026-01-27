'use client';

import { categoriesCollection } from '@/collections/categories';
import { rpcClient } from '@/lib/rpc-client';
import { useLiveQuery } from '@tanstack/react-db';
import { useState } from 'react';

export default function CategoriesPage() {
  const [name, setName] = useState('');

  const { data: categories } = useLiveQuery(q =>
    q.from({ categories: categoriesCollection })
  );

  rpcClient.categories.all().then(res => {
    console.log('RPC Categories:', res);
  });

  const createCategory = (name: string) => {
    // categoriesCollection.insert({
    //   id: 0,
    //   name: name,
    //   createdAt: new Date(),
    //   updatedAt: new Date(),
    //   deletedAt: null,
    // });
    const a = rpcClient.categories.create({
      name,
    });
    console.log('Created category:', a);
  };

  return (
    <div>
      Categories
      <div>
        {categories.map(category => {
          return <div key={category.id}>{category.name}</div>;
        })}
      </div>
      <input
        placeholder="New category name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <button onClick={() => createCategory(name)}>Add category</button>
    </div>
  );
}
