'use client';

import { useId } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import type { DragEndEvent } from '@dnd-kit/core';

import { Check, ChevronDown, GripVertical, RotateCcw, Settings2 } from 'lucide-react';
import { type Column, type Table } from '@tanstack/react-table';
import { Button } from '@repo/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/popover';

interface DataTableColumnEditorProps<TData> {
  table: Table<TData>;
}

export function DataTableColumnEditor<TData>({
  table,
}: DataTableColumnEditorProps<TData>) {
  // Use a unique ID for the DndContext to prevent conflicts with other DndContext instances.
  const dndContextId = useId();

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const columns = getToggleableColumns(table);
  const columnIds = columns.map(col => col.id);

  /**
   * Updates the table column order after a drag ends.
   * It reorders only the toggleable columns and keeps the non-toggleable ones in place.
   */
  function handleDragEnd(event: DragEndEvent) {
    // "active" is the dragged item. "over" is the item it was dropped on.
    const { active, over } = event;
    // Stop if the item was not dropped over anything or if it was dropped on itself.
    if (!over || active.id === over.id) return;

    // Find the index of the dragged item and the item it was dropped on.
    const oldIndex = columnIds.indexOf(String(active.id));
    const newIndex = columnIds.indexOf(String(over.id));
    // Stop if either index is not found.
    if (oldIndex === -1 || newIndex === -1) return;

    // Move the dragged item to the new position.
    const newOrder = arrayMove(columnIds, oldIndex, newIndex);

    // Use saved order if it exists, otherwise default table order.
    const fullOrder =
      table.getState().columnOrder.length > 0
        ? table.getState().columnOrder
        : table.getAllColumns().map(c => c.id);

    // Keep only the non-toggleable columns.
    const nonToggleable = fullOrder.filter(id => !columnIds.includes(id));
    // Set the new column order.
    table.setColumnOrder([...nonToggleable, ...newOrder]);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Columns</span>
          <ChevronDown className="hidden h-4 w-4 sm:inline" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-52 p-1.5">
        {/* Sortable area only */}
        <div className="max-h-72 overflow-y-auto pb-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
            id={dndContextId}
          >
            <SortableContext items={columnIds} strategy={verticalListSortingStrategy}>
              {columns.map(column => (
                <SortableColumnItem
                  key={column.id}
                  id={column.id}
                  label={column.id}
                  visible={column.getIsVisible()}
                  onToggle={() => column.toggleVisibility()}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="mt-1 border-t pt-1">
          <button
            onClick={() => {
              table.resetColumnVisibility();
              table.resetColumnOrder();
            }}
            className="text-muted-foreground hover:bg-accent/50 hover:text-foreground flex w-full items-center justify-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset to default</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SortableColumnItem({
  id,
  label,
  visible,
  onToggle,
}: {
  id: string;
  label: string;
  visible: boolean;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className={`flex items-center gap-2 rounded-sm px-2 py-1.5 ${
        isDragging ? 'bg-accent z-10 shadow-sm' : 'hover:bg-accent/50'
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none p-1 active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3" />
      </button>

      <button
        onClick={onToggle}
        className="flex flex-1 cursor-pointer items-center gap-2 text-sm"
      >
        <span
          className={`capitalize ${visible ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {label}
        </span>
        <Check
          className={`ml-auto h-3.5 w-3.5 transition-colors ${
            visible ? 'text-primary' : 'text-transparent'
          }`}
        />
      </button>
    </div>
  );
}

/**
 * Returns all toggleable columns sorted by the table's current
 * column order, so the column visibility menu matches the table UI.
 */
function getToggleableColumns<TData>(table: Table<TData>): Column<TData>[] {
  // columnOrder is an array of column ids that determines the order of the columns, from TanStack Table state.
  // If it is empty ([]), that means there is no custom reordered order saved.
  const { columnOrder } = table.getState();

  // Get all leaf columns.
  // "Leaf" columns are the final actual columns of the table, not parent/group columns.
  // Then keep only the columns that are allowed to be hidden.
  const toggleableColumns = table
    .getAllLeafColumns()
    .filter(column => column.getCanHide());

  // If there is no custom column order yet,
  // return the toggleable columns in their default order.
  if (columnOrder.length === 0) {
    return toggleableColumns;
  }

  // Sort a copy of the columns based on their position in columnOrder.
  return [...toggleableColumns].sort((a, b) => {
    // Find the order index for column "a".
    // If it doesn't exist, place it at the end.
    const aIndex = columnOrder.indexOf(a.id);
    // Find the order index for column "b".
    // If it doesn't exist, place it at the end.
    const bIndex = columnOrder.indexOf(b.id);
    // Lower index means earlier in the list.
    return aIndex - bIndex;
  });
}
