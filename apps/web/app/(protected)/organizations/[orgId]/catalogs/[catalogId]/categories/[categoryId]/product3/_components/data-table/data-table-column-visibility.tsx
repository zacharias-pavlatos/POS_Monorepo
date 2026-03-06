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
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { Check, ChevronDown, GripVertical, RotateCcw, Settings2 } from 'lucide-react';
import { type Column, type Table } from '@tanstack/react-table';
import { Button } from '@repo/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/popover';

// ── Single sortable column item ─────────────────────────────────────────────

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
      className={`flex items-center gap-2 rounded-sm px-2 py-1.5 ${
        isDragging ? 'bg-accent z-10 shadow-sm' : 'hover:bg-accent/50'
      }`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function getToggleableColumns<TData>(table: Table<TData>): Column<TData, unknown>[] {
  const columnOrder = table.getState().columnOrder;

  const columns = table.getAllLeafColumns().filter(column => column.getCanHide());

  if (columnOrder.length === 0) {
    return columns;
  }

  const orderIndex = new Map(columnOrder.map((id, index) => [id, index] as const));

  return [...columns].sort((a, b) => {
    const aIndex = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });
}

// ── Main component ──────────────────────────────────────────────────────────

interface DataTableColumnVisibilityProps<TData> {
  table: Table<TData>;
}

export function DataTableColumnVisibility<TData>({
  table,
}: DataTableColumnVisibilityProps<TData>) {
  const sortableId = React.useId();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  const columns = getToggleableColumns(table);
  const columnIds = columns.map(col => col.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = columnIds.indexOf(String(active.id));
    const newIndex = columnIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(columnIds, oldIndex, newIndex);

    const toggleableSet = new Set(columnIds);
    const fullOrder =
      table.getState().columnOrder.length > 0
        ? table.getState().columnOrder
        : table.getAllColumns().map(c => c.id);

    const nonToggleable = fullOrder.filter(id => !toggleableSet.has(id));
    table.setColumnOrder([...nonToggleable, ...newOrder]);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          <span>Columns</span>
          <ChevronDown className="h-4 w-4" />
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
            id={sortableId}
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
