'use client';

import { type Table } from '@tanstack/react-table';
import { LayoutGrid, List, Plus, X } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import type { Product, ViewMode } from './types';
import { DataTableColumnVisibility } from './data-table-column-visibility';
import { FilterBuilder } from './filter/filter-builder';
import { type ActiveFilters } from './filter/filter-fields';

interface DataTableToolbarProps {
  table: Table<Product>;
  data: Product[];
  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  filters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onAdd?: () => void;
}

export function DataTableToolbar({
  table,
  data,
  globalFilter,
  onGlobalFilterChange,
  filters,
  onFiltersChange,
  view,
  onViewChange,
  onAdd,
}: DataTableToolbarProps) {
  return (
    <>
      {/* ── Header row ── */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold tracking-tight">Products</h1>
          <span className="text-muted-foreground font-mono text-xs tracking-widest uppercase">
            Catalog
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Column visibility + reorder — list view only */}
          {view === 'list' && <DataTableColumnVisibility table={table} />}

          {/* View toggle */}
          <div className="flex overflow-hidden rounded-md border">
            {(
              [
                { key: 'card', Icon: LayoutGrid },
                { key: 'list', Icon: List },
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
                onClick={() => onViewChange(key)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>

          {/* Add product */}
          <Button size="sm" className="gap-1.5" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            <span className="hidden lg:inline">Add Product</span>
          </Button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-4 lg:px-6">
        <Label htmlFor="product-search" className="sr-only">
          Search products
        </Label>
        <Input
          id="product-search"
          placeholder="Search products, categories, tags..."
          value={globalFilter}
          onChange={e => onGlobalFilterChange(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* ── Filter builder (chip-based) ── */}
      <div className="px-4 lg:px-6">
        <FilterBuilder data={data} filters={filters} onFiltersChange={onFiltersChange} />
      </div>
    </>
  );
}
