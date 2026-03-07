'use client';

import { DataTable } from './_components/data-table/data-table';
import { columns, productFilterFields, ProductCard } from './_components/product';
import { formatPrice } from './_components/utils/format-price';
import type { Product } from './_components/types';

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
    price: 1150,
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
  return (
    <div className="container mx-auto max-w-6xl py-8">
      <DataTable
        data={PRODUCTS}
        columns={columns}
        title="Products"
        subtitle="Catalog"
        filterFields={productFilterFields}
        formatRangeValue={v => formatPrice(v * 100)}
        searchPlaceholder="Search products, categories, tags..."
        defaultColumnVisibility={{ tags: false, modifiers: false }}
        cardRenderer={row => <ProductCard product={row.original} />}
        addLabel="Add Product"
        onAdd={() => console.log('Open create product form')}
        onReorder={reordered =>
          console.log(
            'New order:',
            reordered.map(p => p.id)
          )
        }
      />
    </div>
  );
}
