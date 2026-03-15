'use client';

import { useBasicDataTable } from '@/components/data-table/hooks/use-basic-data-table';
import { DataTable } from '@/components/data-table/data-table';
import { DraggableTable } from '@/components/data-table/data-table-dragable';

import { columns } from './_components/product-table-columns';
import type { Product } from './_components/types';
import * as React from 'react';
import { DataTableColumnEditor } from '../product3/_components/data-table';
import { DataTableSearchBar } from '@/components/data-table/data-table-seartch-bar';
import { productFilterFields } from './_components/product-table-filter-fields';
// import { DataTableFilter } from './_components/DataTableFilter';
import { DataTableFilter } from '@/components/data-table/data-table-filter-builder';

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Classic Margherita',
    categories: ['Pizza', 'Vegetarian'],
    price: 1290,
    image: '🍕',
    stock: 'in_stock',
    workstation: 'Oven',
    modifiers: 3,
    tags: ['popular'],
  },
  {
    id: '2',
    name: 'Chicken Souvlaki',
    categories: ['Grill', 'Mains'],
    price: 1290,
    image: '🍗',
    stock: 'in_stock',
    workstation: 'Grill',
    modifiers: 2,
    tags: ['popular', 'gluten-free'],
  },
  {
    id: '3',
    name: 'Greek Salad',
    categories: ['Salads', 'Vegetarian', 'Starters'],
    price: 890,
    image: '🥗',
    stock: 'in_stock',
    workstation: 'Cold',
    modifiers: 1,
    tags: ['vegan', 'gluten-free'],
  },
  {
    id: '4',
    name: 'Lamb Gyro Wrap',
    categories: ['Wraps', 'Mains'],
    price: 980,
    image: '🌯',
    stock: 'low_stock',
    workstation: 'Grill',
    modifiers: 4,
    tags: [],
  },
  {
    id: '5',
    name: 'Feta Bruschetta',
    categories: ['Starters', 'Vegetarian'],
    price: 750,
    image: '🧀',
    stock: 'in_stock',
    workstation: 'Cold',
    modifiers: 0,
    tags: ['popular'],
  },
  {
    id: '6',
    name: 'Grilled Sea Bass',
    categories: ['Seafood', 'Mains'],
    price: 2450,
    image: '🐟',
    stock: 'in_stock',
    workstation: 'Grill',
    modifiers: 2,
    tags: ['gluten-free'],
  },
];

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>(PRODUCTS);

  const { table } = useBasicDataTable({
    data: products,
    columns,
  });

  return (
    <div>
      <DataTableSearchBar table={table} />
      <DataTableFilter table={table} data={products} fields={productFilterFields} />
      <DataTableColumnEditor table={table} />
      <DraggableTable table={table} onReorder={setProducts} />
    </div>
  );
}
