/**
 * A global search bar component for the data table.
 *
 * It connects directly to the TanStack table instance to provide a unified
 * global filter value. It features a clear button that appears when text is
 * entered, allowing for quick resets of the search query.
 */

'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import type { Table } from '@tanstack/react-table';

import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { cn } from '@repo/ui/lib/utils';

interface DataTableSearchBarProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
  placeholder?: string;
  inputId?: string;
}

export function DataTableSearchBar<TData>({
  table,
  placeholder = 'Search...',
  className,
  ...props
}: DataTableSearchBarProps<TData>) {
  const value = (table.getState().globalFilter as string) ?? '';

  return (
    <div className={cn('min-w-0 flex-1', className)} {...props}>
      <Label htmlFor="data-table-search" className="sr-only">
        Search
      </Label>

      <div className="relative w-full max-w-sm">
        <Input
          className="h-9 pr-9 pl-9"
          id="data-table-search"
          value={value}
          placeholder={placeholder}
          onChange={e => table.setGlobalFilter(e.target.value)}
        />

        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
            onClick={() => table.setGlobalFilter('')}
          >
            <X className="size-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
