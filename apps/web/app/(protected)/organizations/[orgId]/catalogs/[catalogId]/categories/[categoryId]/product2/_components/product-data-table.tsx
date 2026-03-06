'use client';

import * as React from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import type { Product, ViewMode } from './types';

import { columns } from './columns';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';
import { DraggableRow } from './draggable-row';
import { type ActiveFilters } from './filter/filter-fields';
import { ProductCard } from './product-card';

// ── Props ───────────────────────────────────────────────────────────────────

interface ProductDataTableProps {
  data: Product[];
  onAdd?: () => void;
  onReorder?: (reordered: Product[]) => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export function ProductDataTable({
  data: initialData,
  onAdd,
  onReorder,
}: ProductDataTableProps) {
  // ── State ──
  const [view, setView] = React.useState<ViewMode>('list');
  const [data, setData] = React.useState(initialData);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  function handleFiltersChange(next: ActiveFilters) {
    setFilters(next);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    tags: false,
    modifiers: false,
  });
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [filters, setFilters] = React.useState<ActiveFilters>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Derive TanStack columnFilters from our chip-based ActiveFilters
  const columnFilters = React.useMemo<ColumnFiltersState>(
    () => Object.entries(filters).map(([id, value]) => ({ id, value })),
    [filters]
  );

  // Column order — drag + drop reorderable columns.
  // "drag", "select", "name" are pinned first; the rest are reorderable.
  const [columnOrder, setColumnOrder] = React.useState<string[]>([
    'drag',
    'select',
    'image',
    'name',
    'categories',
    'workstation',
    'price',
    'tags',
    'modifiers',
    'stock',
  ]);

  // ── DnD setup ──
  // Stable id to avoid SSR hydration mismatches in Next.js
  const sortableId = React.useId();

  // Explicit sensors per input type (shadcn pattern)
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  // Memoized ids for SortableContext
  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data.map(({ id }) => id),
    [data]
  );

  // ── Table instance ──
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
      columnOrder,
    },
    getRowId: row => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // ── Drag end handler ──
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData(prev => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        const reordered = arrayMove(prev, oldIndex, newIndex);
        onReorder?.(reordered);
        return reordered;
      });
    }
  }

  const rows = table.getRowModel().rows;

  // ── Render ──
  return (
    <div className="flex w-full flex-col gap-4">
      <DataTableToolbar
        table={table}
        data={data}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        view={view}
        onViewChange={setView}
        onAdd={onAdd}
      />

      {/* ── Content ── */}
      <div className="px-4 lg:px-6">
        {rows.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center text-sm">
            No products match your filters.
          </div>
        ) : view === 'card' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
            {rows.map(row => (
              <ProductCard key={row.id} product={row.original} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {rows.length ? (
                    <SortableContext
                      items={dataIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {rows.map(row => (
                        <DraggableRow key={row.id} row={row} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
        )}
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
