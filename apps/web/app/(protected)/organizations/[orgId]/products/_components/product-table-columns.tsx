'use client';

import { Badge } from '@repo/ui/components/badge';
import { ColumnHeader } from '@/components/data-table/data-table-column-header';

import { formatPrice } from '@/utils/format-price';
import { StockBadge } from '@/components/stock-badge';

import type { ColumnDef } from '@tanstack/react-table';
import type { SelectProductType as Product } from '@repo/orpc/contracts';

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: 'image',
    header: '',
    cell: ({ row }) => <span className="text-xl">{row.getValue('image')}</span>,
    enableSorting: false,
    size: 40,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <ColumnHeader column={column}>Product</ColumnHeader>,
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{product.name}</span>
          {/* {product.tags.length > 0 && (
            <span className="text-muted-foreground text-xs">
              {product.tags.join(' · ')}
            </span>
          )} */}
        </div>
      );
    },
  },
  // {
  //   accessorKey: 'categories',
  //   header: 'Categories',
  //   cell: ({ row }) => {
  //     const categories = row.getValue<string[]>('categories');
  //     return (
  //       <div className="flex flex-wrap gap-1">
  //         {categories.map(c => (
  //           <Badge key={c} variant="outline" className="text-xs font-normal">
  //             {c}
  //           </Badge>
  //         ))}
  //       </div>
  //     );
  //   },
  //   filterFn: (row, columnId, filterValues: string[]) => {
  //     const rowCategories = row.getValue<string[]>(columnId);
  //     return filterValues.some(v => rowCategories.includes(v));
  //   },
  //   enableSorting: false,
  // },
  // {
  //   accessorKey: 'workstation',
  //   header: ({ column }) => <ColumnHeader column={column}>Workstation</ColumnHeader>,
  //   cell: ({ row }) => (
  //     <span className="text-muted-foreground font-mono text-xs">
  //       {row.getValue('workstation')}
  //     </span>
  //   ),
  //   filterFn: (row, columnId, filterValues: string[]) => {
  //     return filterValues.includes(row.getValue(columnId));
  //   },
  // },
  {
    accessorKey: 'basePrice',
    header: ({ column }) => <ColumnHeader column={column}>Price</ColumnHeader>,
    cell: ({ row }) => (
      <span className="font-mono font-semibold">
        {formatPrice(row.getValue('basePrice'))}
      </span>
    ),
    filterFn: (row, columnId, filterValue: [number, number]) => {
      const price = row.getValue<number>(columnId) / 100;
      return price >= filterValue[0] && price <= filterValue[1];
    },
  },
  // {
  //   accessorKey: 'tags',
  //   header: 'Tags',
  //   cell: ({ row }) => {
  //     const tags = row.getValue<string[]>('tags');
  //     if (tags.length === 0) return <span className="text-muted-foreground">—</span>;
  //     return (
  //       <div className="flex flex-wrap gap-1">
  //         {tags.map(t => (
  //           <Badge key={t} variant="outline" className="text-xs font-normal">
  //             {t}
  //           </Badge>
  //         ))}
  //       </div>
  //     );
  //   },
  //   filterFn: (row, columnId, filterValues: string[]) => {
  //     const rowTags = row.getValue<string[]>(columnId);
  //     return filterValues.some(v => rowTags.includes(v));
  //   },
  //   enableSorting: false,
  // },
  // {
  //   accessorKey: 'modifiers',
  //   header: ({ column }) => <ColumnHeader column={column}>Modifiers</ColumnHeader>,
  //   cell: ({ row }) => {
  //     const count = row.getValue<number>('modifiers');
  //     return (
  //       <span className="text-muted-foreground font-mono text-xs">
  //         {count > 0 ? `${count} groups` : '—'}
  //       </span>
  //     );
  //   },
  // },
  // {
  //   accessorKey: 'stock',
  //   header: ({ column }) => <ColumnHeader column={column}>Stock</ColumnHeader>,
  //   cell: ({ row }) => <StockBadge stock={row.getValue('stock')} />,
  //   filterFn: (row, columnId, filterValues: string[]) => {
  //     return filterValues.includes(row.getValue(columnId));
  //   },
  //   // enableSorting: false,
  // },
];
