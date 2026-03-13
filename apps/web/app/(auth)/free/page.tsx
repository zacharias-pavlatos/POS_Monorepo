'use client';

import { ReorderableCardGrid } from '@/components/card-grid/reordable-card-grid';
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FloatingBar,
  FloatingBarContent,
  FloatingBarBadge,
  FloatingBarMessage,
  FloatingBarSeparator,
  FloatingBarActions,
} from '@/components/floating-bar';
import { Button } from '@repo/ui/components/button';
import router from 'next/router';

export interface Product {
  id: string;
  name: string;
  categories: string[];
  price: number; // cents
  image: string;
  stock: 'in_stock' | 'low_stock' | 'out_of_stock';
  workstation: string;
  modifiers: number;
  tags: string[];
}
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
  const [products, setProducts] = useState(PRODUCTS);
  const [isDragging, setIsDragging] = useState(false);
  const snapshotRef = useRef<Product[]>(PRODUCTS);

  const handleReorder = (reordered: Product[]) => {
    setProducts(reordered);
  };

  const changeCount = useMemo(() => {
    return products.filter((item, index) => item.id !== snapshotRef.current[index]?.id)
      .length;
  }, [products]);

  const showActionBar = changeCount > 0 && !isDragging;

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        <ReorderableCardGrid
          items={products}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          onReorder={handleReorder}
          renderItem={product => (
            <Link href={`/products/${product.id}`} className="block h-full">
              <ProductCard product={product} />
            </Link>
          )}
        />
      </div>

      {showActionBar && (
        <FloatingBar>
          <FloatingBarContent>
            <FloatingBarBadge>{changeCount}</FloatingBarBadge>
            <FloatingBarMessage>
              {changeCount === 1 ? 'item moved' : 'items moved'}
            </FloatingBarMessage>
          </FloatingBarContent>
          <FloatingBarSeparator />
          <FloatingBarActions>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => console.log('Cancel')}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => console.log('Save order')}
            >
              Save order
            </Button>
          </FloatingBarActions>
        </FloatingBar>
      )}
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group bg-card hover:border-border/80 flex cursor-pointer flex-col gap-2 rounded-lg border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm">
      <div className="bg-muted flex h-16 items-center justify-center rounded-md text-3xl">
        {product.image}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <span className="truncate text-sm font-semibold">{product.name}</span>
        <div className="flex flex-wrap gap-1">
          {product.categories.map(c => (
            <span
              key={c}
              className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold">{product.price}</span>
        <span className="text-muted-foreground text-xs">{product.stock}</span>
      </div>
    </div>
  );
}
