/**
 * Column Header
 *
 * This component represents the name of a column.
 * It renders a clickable header label with a sort indicator and allows the
 * user to change the sorting state of the column.
 *
 * Not all columns are sortable.
 * This is defined in the column configuration where the table columns
 * are declared. (e.g. enableSorting: true)
 */

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { type Column } from '@tanstack/react-table';
import { Button } from '@repo/ui/components/button';

interface ColumnHeaderProps<TData> {
  column: Column<TData>;
  children: React.ReactNode;
}

export function ColumnHeader<TData>({ column, children }: ColumnHeaderProps<TData>) {
  const handleSort = () => {
    const sorted = column.getIsSorted();
    sorted === 'asc' ? column.clearSorting() : column.toggleSorting(sorted !== 'desc');
  };

  return (
    <Button variant="ghost" size="sm" className="-ml-3 h-8 gap-1" onClick={handleSort}>
      {children}
      {column.getIsSorted() === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : column.getIsSorted() === 'desc' ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="text-muted-foreground/50 h-3.5 w-3.5" />
      )}
    </Button>
  );
}
