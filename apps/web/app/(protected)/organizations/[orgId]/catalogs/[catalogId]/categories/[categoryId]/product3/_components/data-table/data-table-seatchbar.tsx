'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import type { Table } from '@tanstack/react-table';

import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { cn } from '@repo/ui/lib/utils';

interface DataTableSearchbarProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
  placeholder?: string;
  inputId?: string;
}

export function DataTableSearchbar<TData>({
  table,
  placeholder = 'Search...',
  inputId = 'data-table-search',
  className,
  ...props
}: DataTableSearchbarProps<TData>) {
  const value = (table.getState().globalFilter as string) ?? '';

  return (
    <div className={cn('min-w-0 flex-1', className)} {...props}>
      <Label htmlFor={inputId} className="sr-only">
        Search
      </Label>

      <div className="relative w-full max-w-sm">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

        <Input
          id={inputId}
          value={value}
          onChange={e => table.setGlobalFilter(e.target.value)}
          placeholder={placeholder}
          className="h-9 pr-9 pl-9"
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
