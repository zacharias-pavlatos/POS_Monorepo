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
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';

import { DataTableColumnEditor } from './data-table-column-editor';
import { DataTablePagination } from './data-table-pagination';
import { DataTableSortIndicator } from './data-table-sort-indicator';
import { DraggableProvider } from './drag-handle';
import { DraggableRow } from './draggable-row';
import { FilterBuilder } from './filter/filter-builder';
import { ReorderableCardGrid } from './reorderable-card-grid';

import type { ActiveFilters, FilterFieldDef } from './filter/types';

// ── Props ───────────────────────────────────────────────────────────────────

interface DataTableProps<TData extends { id: string }> {
  data: TData[];
  columns: ColumnDef<TData, any>[];

  /** If provided, enables row drag-and-drop reordering. Add createDragColumn() to your columns. */
  onReorder?: (reordered: TData[]) => void;

  /** Filter field definitions for the chip-based filter builder */
  filterFields?: FilterFieldDef<TData>[];
  formatRangeValue?: (value: number) => string;

  /** Render a card for grid view. If not provided, card view is disabled. */
  cardRenderer?: (row: Row<TData>) => React.ReactNode;
  searchPlaceholder?: string;
  defaultColumnVisibility?: VisibilityState;

  title: string;
  subtitle?: string;
  onAdd?: () => void;
  addLabel?: string;
}

// ── Component ───────────────────────────────────────────────────────────────

export function DataTable<TData extends { id: string }>({
  data: initialData,
  columns,
  onReorder,
  filterFields = [],
  formatRangeValue,
  cardRenderer,
  searchPlaceholder = 'Search...',
  defaultColumnVisibility = {},
  title,
  subtitle,
  onAdd,
  addLabel = 'Add',
}: DataTableProps<TData>) {
  const isDraggable = onReorder != null;

  // ── State ──
  const [view, setView] = React.useState<'card' | 'list'>(cardRenderer ? 'card' : 'list');
  const [data, setData] = React.useState(initialData);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    defaultColumnVisibility
  );
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [filters, setFilters] = React.useState<ActiveFilters>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);

  // Derive TanStack columnFilters from chip-based ActiveFilters
  const columnFilters = React.useMemo<ColumnFiltersState>(
    () => Object.entries(filters).map(([id, value]) => ({ id, value })),
    [filters]
  );

  function handleFiltersChange(next: ActiveFilters) {
    setFilters(next);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }

  // ── Table instance ──
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter,
      pagination,
      columnOrder,
    },
    getRowId: row => row.id,
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

  // ── DnD setup (only used when isDraggable) ──
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const rows = table.getRowModel().rows;
  const isSorted = sorting.length > 0;
  const isFiltered = columnFilters.length > 0 || globalFilter.length > 0;
  const isDragDisabled = isSorted || isFiltered;
  const dragDisabledReason = isSorted
    ? 'Clear sorting to reorder rows'
    : isFiltered
      ? 'Clear filters to reorder rows'
      : undefined;

  const sortableRowIds = React.useMemo<UniqueIdentifier[]>(
    () => rows.map(row => row.original.id),
    [rows]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    setData(prev => {
      const oldIndex = prev.findIndex(item => item.id === active.id);
      const newIndex = prev.findIndex(item => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex);
      onReorder?.(reordered);
      return reordered;
    });
  }

  // ── Table body rendering ──
  function renderTableRows() {
    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-24 text-center">
            No results.
          </TableCell>
        </TableRow>
      );
    }

    if (isDraggable) {
      return (
        <SortableContext items={sortableRowIds} strategy={verticalListSortingStrategy}>
          {rows.map(row => (
            <DraggableRow key={row.id} row={row} />
          ))}
        </SortableContext>
      );
    }

    return rows.map(row => (
      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
        {row.getVisibleCells().map(cell => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  }

  function renderTable() {
    const tableElement = (
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>{renderTableRows()}</TableBody>
      </Table>
    );

    // Wrap in DndContext only when draggable
    if (isDraggable) {
      return (
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          {tableElement}
        </DndContext>
      );
    }

    return tableElement;
  }

  // ── Main render ──
  const content = (
    <div className="flex w-full flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
              {subtitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {view === 'list' && <DataTableColumnEditor table={table} />}

          {cardRenderer && (
            <div className="flex overflow-hidden rounded-md border">
              {(
                [
                  { key: 'card' as const, Icon: LayoutGrid },
                  { key: 'list' as const, Icon: List },
                ] as const
              ).map(({ key, Icon }) => (
                <Button
                  key={key}
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-9 rounded-none ${
                    view === key
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => setView(key)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          )}

          {onAdd && (
            <Button size="sm" className="gap-1.5" onClick={onAdd}>
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">{addLabel}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-4 lg:px-6">
        <Label htmlFor="data-table-search" className="sr-only">
          Search
        </Label>
        <Input
          id="data-table-search"
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* ── Filters ── */}
      {filterFields.length > 0 && (
        <div className="px-4 lg:px-6">
          <FilterBuilder
            data={data}
            fields={filterFields}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            formatRangeValue={formatRangeValue}
          />
        </div>
      )}

      {/* ── Sort indicator ── */}
      {isSorted && (
        <div className="px-4 lg:px-6">
          <DataTableSortIndicator sorting={sorting} onClear={() => setSorting([])} />
        </div>
      )}

      {/* ── Content ── */}
      <div className="px-4 lg:px-6">
        {rows.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center text-sm">
            No results found.
          </div>
        ) : view === 'card' && cardRenderer ? (
          <ReorderableCardGrid
            items={rows.map(row => row.original)}
            renderCard={item => cardRenderer(rows.find(r => r.original.id === item.id)!)}
            onReorder={
              onReorder
                ? reordered => {
                    setData(reordered);
                    onReorder(reordered);
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-hidden rounded-lg border">{renderTable()}</div>
        )}
      </div>

      <DataTablePagination table={table} />
    </div>
  );

  // Wrap in DraggableProvider only when needed
  if (isDraggable) {
    return (
      <DraggableProvider disabled={isDragDisabled} reason={dragDisabledReason}>
        {content}
      </DraggableProvider>
    );
  }

  return content;
}
