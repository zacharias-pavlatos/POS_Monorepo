'use client';

import { ProductDataTable } from './_components/product-data-table';

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

export type ViewMode = 'card' | 'list';

const MOCK_PRODUCTS: Product[] = [
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
  {
    id: '7',
    name: 'Moussaka',
    categories: ['Mains'],
    price: 1380,
    image: '🍲',
    stock: 'in_stock',
    workstation: 'Oven',
    modifiers: 1,
    tags: ['popular'],
  },
  {
    id: '8',
    name: 'Pita Bread Basket',
    categories: ['Sides', 'Vegetarian'],
    price: 350,
    image: '🫓',
    stock: 'in_stock',
    workstation: 'Oven',
    modifiers: 0,
    tags: ['vegan'],
  },
  {
    id: '9',
    name: 'Tzatziki Dip',
    categories: ['Starters', 'Vegetarian'],
    price: 490,
    image: '🥣',
    stock: 'in_stock',
    workstation: 'Cold',
    modifiers: 0,
    tags: ['gluten-free'],
  },
  {
    id: '10',
    name: 'Baklava',
    categories: ['Desserts'],
    price: 650,
    image: '🍯',
    stock: 'low_stock',
    workstation: 'Prep',
    modifiers: 0,
    tags: ['popular'],
  },
  {
    id: '11',
    name: 'Espresso Freddo',
    categories: ['Drinks', 'Cold Drinks'],
    price: 420,
    image: '☕',
    stock: 'in_stock',
    workstation: 'Bar',
    modifiers: 2,
    tags: [],
  },
  {
    id: '12',
    name: 'Lemonade',
    categories: ['Drinks', 'Cold Drinks'],
    price: 380,
    image: '🍋',
    stock: 'out_of_stock',
    workstation: 'Bar',
    modifiers: 1,
    tags: ['vegan'],
  },
];

export default function ProductsPage() {
  return (
    <div className="container mx-auto max-w-6xl py-8">
      <ProductDataTable
        data={MOCK_PRODUCTS}
        onAdd={() => {
          // Open your ResponsiveDialog with the product form
          console.log('Open create product form');
        }}
        onReorder={reordered => {
          // Persist new order via your oRPC mutation
          // e.g. updateProductOrder.mutate(reordered.map((p, i) => ({ id: p.id, sortOrder: i })))
          console.log(
            'New order:',
            reordered.map(p => p.id)
          );
        }}
      />
    </div>
  );
}
