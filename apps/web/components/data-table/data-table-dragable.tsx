/**
 * DraggableTable
 *
 * Same as <DataTable> but with drag-and-drop row reordering.
 *
 * Important:
 * - useSortable is called only once per row
 * - DragHandle consumes the sortable listeners through context
 * - Reordering is based on the rendered row order
 */

'use client';

import * as React from 'react';
import {
  type Table as TanstackTable,
  type Row as TanstackRow,
  flexRender,
} from '@tanstack/react-table';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';

interface DraggableTableProps<TData extends { id: string }> {
  table: TanstackTable<TData>;
  onReorder: (items: TData[]) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  emptyMessage?: string;
}
export function DraggableTable<TData extends { id: string }>({
  table,
  onReorder,
  onDragStart: onDragStartProp,
  onDragEnd: onDragEndProp,
  emptyMessage = 'No results.',
}: DraggableTableProps<TData>) {
  const sortableId = React.useId();
  const rows = table.getRowModel().rows;

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const sortableRowIds = React.useMemo<UniqueIdentifier[]>(
    () => rows.map(row => row.original.id),
    [rows]
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentRows = table.getRowModel().rows;
    const currentData = currentRows.map(row => row.original);

    const oldIndex = currentData.findIndex(item => item.id === String(active.id));
    const newIndex = currentData.findIndex(item => item.id === String(over.id));

    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(currentData, oldIndex, newIndex));
    onDragEndProp?.();
  }

  return (
    <DndContext
      id={sortableId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragStart={() => onDragStartProp?.()}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {/* Extra empty header cell for the grab handle. It keeps the header row aligned with the body rows. */}
                <TableHead className="w-10" />
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
                  colSpan={table.getAllColumns().length + 1}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              <SortableContext
                items={sortableRowIds}
                strategy={verticalListSortingStrategy}
              >
                {rows.map(row => (
                  <DraggableRow key={row.id} row={row} />
                ))}
              </SortableContext>
            )}
          </TableBody>
        </Table>
      </div>
    </DndContext>
  );
}

function DraggableRow<TData extends { id: string }>({
  row,
}: {
  row: TanstackRow<TData>;
}) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      ref={setNodeRef}
      data-state={row.getIsSelected() && 'selected'}
      data-dragging={isDragging}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
    >
      {/* Added The handle in order to grab here and not as a column */}
      <TableCell className="align-middle">
        <DragHandle id={row.original.id} />
      </TableCell>
      {row.getVisibleCells().map(cell => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

// /**
//  * Add this as the first column to render the drag handle.
//  * Only use with <DraggableTable>.
//  */
// export function createDragColumn<TData extends { id: string }>(): ColumnDef<TData> {
//   return {
//     id: 'drag',
//     header: () => null,
//     cell: () => <DragHandle />,
//     size: 32,
//     enableSorting: false,
//     enableHiding: false,
//   };
// }

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners, setActivatorNodeRef } = useSortable({ id });

  return (
    <Button
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 cursor-grab hover:bg-transparent active:cursor-grabbing"
    >
      <GripVertical className="size-3.5" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}
