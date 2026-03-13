/**
 * Reorderable grid controller for items with an `id`.
 *
 * Handles drag-and-drop setup, sensors, and reorder calculations,
 * while the parent controls layout and item rendering.
 *
 * Notes:
 * - Touch dragging uses a 250ms press delay to avoid blocking scroll.
 * - Reordering is emitted as a fully reordered `items` array.
 * - Visual drag states are handled by `SortableCard`.
 */

'use client';

import { useId } from 'react';
import {
  DndContext,
  useSensor,
  useSensors,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';

import { SortableCard } from '@/components/card-grid/sortable-card';

import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';

interface ReorderableCardGridProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onReorder: (newItems: T[]) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  disabled?: boolean;
}

export function ReorderableCardGrid<T extends { id: string }>({
  items,
  renderItem,
  onReorder,
  onDragStart: onDragStartProp,
  onDragEnd: onDragEndProp,
  disabled = false,
}: ReorderableCardGridProps<T>) {
  const dndId = useId();

  // 1. Configure the Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Our master clock: 250ms hold to start
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 2. Handle the start of the drag
  const handleDragStart = (event: DragStartEvent) => {
    // if (typeof navigator !== 'undefined' && navigator.vibrate) {
    //   navigator.vibrate(10);
    // }
    onDragStartProp?.();
  };

  // 3. Handle the drop (The actual reordering)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === String(active.id));
      const newIndex = items.findIndex(item => item.id === String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(items, oldIndex, newIndex));
      }
    }
    // Fire even if no reorder happened
    onDragEndProp?.();
  };

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToParentElement]}
      // Smoothly scroll the container when the card hits the edge
      autoScroll={{ acceleration: 10 }}
    >
      {/* 4. SortableContext needs the IDs of your items */}
      <SortableContext items={items.map(item => item.id)} strategy={rectSortingStrategy}>
        {items.map(item => (
          <SortableCard key={item.id} id={item.id} disabled={disabled}>
            {renderItem(item)}
          </SortableCard>
        ))}
      </SortableContext>
    </DndContext>
  );
}
