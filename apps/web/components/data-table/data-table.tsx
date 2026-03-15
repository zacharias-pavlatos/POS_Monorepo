/**
 * DataTable
 *
 * Pure rendering component. Receives a TanStack `table` instance,
 * renders headers + rows. No state, no DnD, no toolbars.
 *
 * For drag-and-drop, use <DraggableTable> instead.
 */

'use client';

import { flexRender } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';

import type { Table as TanstackTable, Row as TanstackRow } from '@tanstack/react-table';

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  emptyMessage?: string;
}
export function DataTable<TData>({
  table,
  emptyMessage = 'No results.',
}: DataTableProps<TData>) {
  const rows = table.getRowModel().rows;

  return (
    <div className="overflow-hidden rounded-lg border">
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
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map(row => <DataTableRow key={row.id} row={row} />)
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface DataTableRowProps<TData> {
  row: TanstackRow<TData>;
}
export function DataTableRow<TData>({ row }: DataTableRowProps<TData>) {
  return (
    <TableRow data-state={row.getIsSelected() && 'selected'}>
      {row.getVisibleCells().map(cell => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}
