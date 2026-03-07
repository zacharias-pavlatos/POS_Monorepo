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

import type { ActiveFilters, FilterFieldDef } from './filter/types';
import { DataTableColumnVisibility } from './data-table-column-visibility';
import { DataTablePagination } from './data-table-pagination';
import { DraggableRow } from './draggable-row';
import { FilterBuilder } from './filter/filter-builder';

// ── Props ───────────────────────────────────────────────────────────────────

interface DataTableProps<TData extends { id: string }> {
  /** Data array */
  data: TData[];
  /** TanStack Table column definitions */
  columns: ColumnDef<TData, any>[];

  /** Filter field definitions for the chip-based filter builder */
  filterFields?: FilterFieldDef<TData>[];
  /** Format range filter values for display in chips (e.g. cents → "€12.90") */
  formatRangeValue?: (value: number) => string;

  /** Render a card for the grid view. If not provided, card view is disabled. */
  cardRenderer?: (row: Row<TData>) => React.ReactNode;
  /** Search placeholder text */
  searchPlaceholder?: string;

  /** Default column visibility (e.g. { tags: false }) */
  defaultColumnVisibility?: VisibilityState;

  /** Header title */
  title: string;
  /** Header subtitle */
  subtitle?: string;

  /** Called when the add button is clicked */
  onAdd?: () => void;
  /** Add button label */
  addLabel?: string;
  /** Called when rows are reordered via drag-and-drop */
  onReorder?: (reordered: TData[]) => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export function DataTable<TData extends { id: string }>({
  data: initialData,
  columns,
  filterFields = [],
  formatRangeValue,
  cardRenderer,
  searchPlaceholder = 'Search...',
  defaultColumnVisibility = {},
  title,
  subtitle,
  onAdd,
  addLabel = 'Add',
  onReorder,
}: DataTableProps<TData>) {
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

  // ── DnD setup ──
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );
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
          {onAdd && (
            <Button size="sm" className="gap-1.5" onClick={onAdd}>
              <Plus className="h-4 w-4" />
              {/* <span className="hidden lg:inline">{addLabel}</span> */}
              <span className="inline">{addLabel}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      <div className="flex items-center justify-between gap-3 px-4 lg:px-6">
        <div className="min-w-0 flex-1">
          <Label htmlFor="data-table-search" className="sr-only">
            Search
          </Label>
          <Input
            id="data-table-search"
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="max-w-xs truncate"
          />
        </div>

        <div className="flex items-center gap-2">
          {view === 'list' && <DataTableColumnVisibility table={table} />}

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
        </div>
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

      {/* ── Content ── */}
      <div className="px-4 lg:px-6">
        {rows.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center text-sm">
            No results found.
          </div>
        ) : view === 'card' && cardRenderer ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {rows.map(row => (
              <React.Fragment key={row.id}>{cardRenderer(row)}</React.Fragment>
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
