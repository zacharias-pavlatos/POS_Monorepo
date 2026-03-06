export type FilterFieldType = "multi_array" | "multi_value" | "range"

export interface FilterFieldDef<TData> {
  /** Column id — must match a column accessorKey */
  key: string
  label: string
  type: FilterFieldType
  /** Returns available options from the dataset. Used for multi_array and multi_value. */
  options?: (data: TData[]) => string[]
  /** Format option labels for display (e.g. "in_stock" → "In Stock") */
  formatOption?: (value: string) => string
  /** For range filters */
  min?: number
  max?: number
  step?: number
  /** Extract the numeric value from a row for histogram/counting. For range filters. */
  getValue?: (item: TData) => number
}

export type ActiveFilters = Record<string, string[] | [number, number]>
