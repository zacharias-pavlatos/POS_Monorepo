'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/ui/components/badge';
import { Checkbox } from '@repo/ui/components/checkbox';
import { DragHandle } from './drag-handle';
import { SortHeader } from './sort-header';
import { StockBadge } from './stock-badge';

import { formatPrice } from './utils/format-price';

import type { Product } from './types';

export const columns: ColumnDef<Product>[] = [
  {
    id: 'drag',
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'image',
    header: '',
    cell: ({ row }) => <span className="text-xl">{row.getValue('image')}</span>,
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <SortHeader column={column}>Product</SortHeader>,
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{product.name}</span>
          {product.tags.length > 0 && (
            <span className="text-muted-foreground text-xs">
              {product.tags.join(' · ')}
            </span>
          )}
        </div>
      );
    },
    // enableHiding: false,
  },
  {
    accessorKey: 'categories',
    header: 'Categories',
    cell: ({ row }) => {
      const categories = row.getValue<string[]>('categories');
      return (
        <div className="flex flex-wrap gap-1">
          {categories.map(c => (
            <Badge key={c} variant="outline" className="text-xs font-normal">
              {c}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, columnId, filterValues: string[]) => {
      const rowCategories = row.getValue<string[]>(columnId);
      return filterValues.some(v => rowCategories.includes(v));
    },
    enableSorting: false,
  },
  {
    accessorKey: 'workstation',
    header: ({ column }) => <SortHeader column={column}>Workstation</SortHeader>,
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-xs">
        {row.getValue('workstation')}
      </span>
    ),
  },
  {
    accessorKey: 'price',
    header: ({ column }) => <SortHeader column={column}>Price</SortHeader>,
    cell: ({ row }) => (
      <span className="font-mono font-semibold">
        {formatPrice(row.getValue('price'))}
      </span>
    ),
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
      const tags = row.getValue<string[]>('tags');
      if (tags.length === 0) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map(t => (
            <Badge key={t} variant="outline" className="text-xs font-normal">
              {t}
            </Badge>
          ))}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'modifiers',
    header: ({ column }) => <SortHeader column={column}>Modifiers</SortHeader>,
    cell: ({ row }) => {
      const count = row.getValue<number>('modifiers');
      return (
        <span className="text-muted-foreground font-mono text-xs">
          {count > 0 ? `${count} groups` : '—'}
        </span>
      );
    },
  },
  {
    accessorKey: 'stock',
    header: 'Status',
    cell: ({ row }) => <StockBadge stock={row.getValue('stock')} />,
    enableSorting: false,
  },
];
