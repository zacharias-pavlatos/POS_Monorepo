import type { Product } from './types';

export type FilterFieldType = 'multi_array' | 'multi_value' | 'range';

interface BaseFilterField {
  /** Column id — must match a column accessorKey */
  key: string;
  label: string;
}

interface MultiArrayFilterField<TData> extends BaseFilterField {
  type: 'multi_array';
  /** Returns available options from the dataset */
  options: (data: TData[]) => string[];
  /** Format option labels for display */
  formatOption?: (value: string) => string;
}

interface MultiValueFilterField<TData> extends BaseFilterField {
  type: 'multi_value';
  /** Returns available options from the dataset */
  options: (data: TData[]) => string[];
  /** Format option labels for display */
  formatOption?: (value: string) => string;
}

interface RangeFilterField<TData> extends BaseFilterField {
  type: 'range';
  /**
   * Optional fixed bounds.
   * If omitted, they are derived from the dataset.
   */
  min?: number;
  max?: number;
  step?: number;
  /** Extract a numeric value from each row */
  getValue: (item: TData) => number;
}

export type FilterFieldDef<TData> =
  | MultiArrayFilterField<TData>
  | MultiValueFilterField<TData>
  | RangeFilterField<TData>;

export type ActiveFilters = Record<string, string[] | [number, number]>;

const STOCK_LABELS: Record<string, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

/**
 * Example without min/max:
 * price bounds are derived from the dataset.
 */
export const productFilterFields: FilterFieldDef<Product>[] = [
  {
    key: 'categories',
    label: 'Category',
    type: 'multi_array',
    options: data => [...new Set(data.flatMap(product => product.categories))].sort(),
  },
  {
    key: 'workstation',
    label: 'Workstation',
    type: 'multi_value',
    options: data => [...new Set(data.map(product => product.workstation))].sort(),
  },
  {
    key: 'stock',
    label: 'Stock Status',
    type: 'multi_value',
    options: () => ['in_stock', 'low_stock', 'out_of_stock'],
    formatOption: value => STOCK_LABELS[value] ?? value,
  },
  {
    key: 'tags',
    label: 'Tag',
    type: 'multi_array',
    options: data =>
      [...new Set(data.flatMap(product => product.tags).filter(Boolean))].sort(),
  },
  {
    key: 'price',
    label: 'Price',
    type: 'range',
    step: 1,
    getValue: product => product.price / 100,
  },
];
