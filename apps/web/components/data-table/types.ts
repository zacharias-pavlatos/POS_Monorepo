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
