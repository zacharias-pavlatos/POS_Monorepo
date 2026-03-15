/**
 * useClientDataTable
 *
 * A thin wrapper around TanStack Table's `useReactTable`.
 * All sorting, filtering, and pagination is handled in-memory by TanStack Table.
 * State is stored in React `useState` — nothing touches the URL.
 *
 * Use this when:
 * - You already have all the data in memory (mock data, static lists, prefetched data)
 * - You don't need URL-synced table state
 * - You want sorting/filtering/pagination to "just work" without a server
 */

import * as React from 'react';
import {
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import type {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  TableOptions,
  TableState,
  VisibilityState,
} from '@tanstack/react-table';

interface UseBasicDataTableProps<TData> extends Omit<
  TableOptions<TData>,
  // We provide these — callers shouldn't override them
  | 'state'
  | 'getCoreRowModel'
  | 'getSortedRowModel'
  | 'getFilteredRowModel'
  | 'getPaginationRowModel'
  | 'getFacetedRowModel'
  | 'getFacetedUniqueValues'
  | 'getFacetedMinMaxValues'
> {
  initialState?: Partial<TableState>;
}

export function useBasicDataTable<TData extends { id: string }>(
  props: UseBasicDataTableProps<TData>
) {
  const { columns, initialState, ...tableProps } = props;

  /*
   * Which columns are sorted and in what direction
   * Example: clicking "Price ↑" sorts rows by price ascending
   */
  const [sorting, setSorting] = React.useState<SortingState>(initialState?.sorting ?? []);
  /*
   * Which rows have their checkbox ticked
   */
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {}
  );
  /*
   * globalFilter — search across all columns
   * Example: typing "margherita" in the search box hides non-matching rows
   */
  const [globalFilter, setGlobalFilter] = React.useState(
    initialState?.globalFilter ?? ''
  );
  /*
   * columnFilters — per-column filters (stock = "in_stock", workstation = "Grill")
   * Example: filter chips like [Stock: In Stock] [Workstation: Grill]
   */
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    initialState?.columnFilters ?? []
  );
  /*
   * Which columns are shown/hidden
   * Example: unchecking "Tags" in the column editor hides that column
   */
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialState?.columnVisibility ?? {}
  );
  /*
   * Which columns are shown in what order
   * Example: dragging "Tags" to the top shows it first
   */
  const [columnOrder, setColumnOrder] = React.useState<string[]>(
    initialState?.columnOrder ?? []
  );
  /*
   * pagination — current page and rows per page
   * Example: "Showing 11-20 of 50" with next/prev buttons
   */
  const [pagination, setPagination] = React.useState<PaginationState>(
    initialState?.pagination ?? { pageIndex: 0, pageSize: 10 }
  );

  const table = useReactTable({
    ...tableProps,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
      rowSelection,
      columnVisibility,
      globalFilter,
      columnOrder,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      /* Columns will be not filterable by default — opt in per column with enableColumnFilter: true to activate.
       * No point filtering columns like select, actions, or image.
       */
      enableColumnFilter: false,
    },

    //TODO: Make this configurable
    enableRowSelection: true,

    /* Enforce stable row identity via data's `id` field (TData extends { id: string }).
     * Without this, TanStack defaults to array index — row selection, DnD, and expansion
     * break when rows are sorted, filtered, or reordered because indices shift.
     */
    getRowId: row => row.id,

    // State setters — TanStack calls these on user interaction
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,

    // Row models — do the actual client-side work
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

  return { table };
}
