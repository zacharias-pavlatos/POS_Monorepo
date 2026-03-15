'use client';

export type ActiveFilters = Record<string, string[] | [number, number]>;

type BaseFilterFieldDef<TData> = {
  key: string;
  label: string;
};

export type MultiValueFilterFieldDef<TData> = BaseFilterFieldDef<TData> & {
  type: 'multi_value' | 'multi_array';
  options: (data: TData[]) => string[];
  formatOption?: (value: string) => string;
};

export type RangeFilterFieldDef<TData> = BaseFilterFieldDef<TData> & {
  type: 'range';
  min?: number;
  max?: number;
  step?: number;
  getValue: (item: TData) => number;
  formatValue?: (value: number) => string;
};

export type FilterFieldDef<TData> =
  | MultiValueFilterFieldDef<TData>
  | RangeFilterFieldDef<TData>;
