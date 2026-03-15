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
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';

import { SortableCard } from './sortable-card';

import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { cn } from '@repo/ui/lib/utils';

interface GridProps<T> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  renderCard: (item: T) => React.ReactNode;
  className?: string;
}

export function ReorderableCardGrid<T extends { id: string }>({
  items,
  onReorder,
  renderCard,
  className,
}: GridProps<T>) {
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
    useSensor(KeyboardSensor)
  );

  // 2. Handle the start of the drag
  const handleDragStart = (event: DragStartEvent) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // 3. Handle the drop (The actual reordering)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(item => item.id === String(active.id));
    const newIndex = items.findIndex(item => item.id === String(over.id));

    if (oldIndex === -1 || newIndex === -1) return;

    // Notify parent of the new order
    onReorder(arrayMove(items, oldIndex, newIndex));
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
          <SortableCard key={item.id} id={item.id}>
            {renderCard(item)}
          </SortableCard>
        ))}
      </SortableContext>
    </DndContext>
  );
}
