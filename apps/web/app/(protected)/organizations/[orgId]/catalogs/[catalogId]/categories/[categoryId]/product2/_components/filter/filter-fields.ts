import type { Product } from '../types';

export type FilterFieldType = 'multi_array' | 'multi_value' | 'range';

export interface FilterFieldDef {
  key: keyof Product | string;
  label: string;
  type: FilterFieldType;
  options?: (data: Product[]) => string[];
  formatOption?: (value: string) => string;
  min?: number;
  max?: number;
  step?: number;
}

export type ActiveFilters = Record<string, string[] | [number, number]>;

const STOCK_LABELS: Record<string, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

export const PRODUCT_FILTER_FIELDS: FilterFieldDef[] = [
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
    key: 'tags',
    label: 'Tag',
    type: 'multi_array',
    options: data => [...new Set(data.flatMap(p => p.tags).filter(Boolean))].sort(),
  },
  {
    key: 'price',
    label: 'Price',
    type: 'range',
    min: 0,
    max: 30,
    step: 0.5,
  },
];
