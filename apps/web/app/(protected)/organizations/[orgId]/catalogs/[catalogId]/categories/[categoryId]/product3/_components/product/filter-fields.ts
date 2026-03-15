import type { FilterFieldDef } from '../data-table';
import type { Product } from '../types';

const STOCK_LABELS: Record<string, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

export const productFilterFields: FilterFieldDef<Product>[] = [
  {
    key: 'categories',
    label: 'Category',
    type: 'multi_array',
    options: data => [...new Set(data.flatMap(p => p.categories))].sort(),
  },
  {
    key: 'workstation',
    label: 'Workstation',
    type: 'multi_value',
    options: data => [...new Set(data.map(p => p.workstation))].sort(),
  },
  {
    key: 'stock',
    label: 'Stock Status',
    type: 'multi_value',
    options: () => ['in_stock', 'low_stock', 'out_of_stock'],
    formatOption: v => STOCK_LABELS[v] ?? v,
  },
  {
    key: 'price',
    label: 'Price',
    type: 'range',
    min: 0,
    max: 30,
    step: 0.5,
    getValue: p => p.price / 100,
  },
  {
    key: 'tags',
    label: 'Tag',
    type: 'multi_array',
    options: data => [...new Set(data.flatMap(p => p.tags).filter(Boolean))].sort(),
  },
];
