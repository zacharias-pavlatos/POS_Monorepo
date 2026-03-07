'use client';

import { Fragment, ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowDownUp, Check, X } from 'lucide-react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '@repo/ui/components/button';

import type { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';

// ── Sortable card wrapper ───────────────────────────────────────────────────

function SortableCard({
  id,
  isReordering,
  children,
}: {
  id: string;
  isReordering: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 10 : undefined,
        // Pause wiggle while actively dragging
        animationPlayState: isDragging ? 'paused' : 'running',
      }}
      className={isReordering ? `cursor-grab active:cursor-grabbing` : ''}
    >
      <div className={isReordering && !isDragging ? 'animate-wiggle' : ''}>
        {children}
      </div>
    </div>
  );
}

// ── Reorderable card grid ───────────────────────────────────────────────────

interface ReorderableCardGridProps<TData extends { id: string }> {
  items: TData[];
  renderCard: (item: TData) => React.ReactNode;
  onReorder?: (reordered: TData[]) => void;
  className?: string;
}

export function ReorderableCardGrid<TData extends { id: string }>({
  items,
  renderCard,
  onReorder,
  className = 'grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3',
}: ReorderableCardGridProps<TData>) {
  const [isReordering, setIsReordering] = useState(false);
  const [localItems, setLocalItems] = useState(items);
  const snapshotRef = useRef<TData[]>(items);

  // Sync with external data when not in reorder mode
  useEffect(() => {
    if (!isReordering) {
      setLocalItems(items);
    }
  }, [items, isReordering]);

  const sortableId = useId();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 1 } }),
    useSensor(KeyboardSensor)
  );

  const itemIds = useMemo<UniqueIdentifier[]>(
    () => localItems.map(item => item.id),
    [localItems]
  );

  function enterReorderMode() {
    snapshotRef.current = localItems;
    setIsReordering(true);
  }

  function applyReorder() {
    setIsReordering(false);
    onReorder?.(localItems);
  }

  function cancelReorder() {
    setLocalItems(snapshotRef.current);
    setIsReordering(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    setLocalItems(prev => {
      const oldIndex = prev.findIndex(item => item.id === active.id);
      const newIndex = prev.findIndex(item => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  // No onReorder callback = no reorder capability
  if (!onReorder) {
    return (
      <div className={className}>
        {items.map(item => (
          <Fragment key={item.id}>{renderCard(item)}</Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2">
        {isReordering ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={cancelReorder}
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button size="sm" className="gap-1.5" onClick={applyReorder}>
              <Check className="h-3.5 w-3.5" />
              Apply
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={enterReorderMode}
          >
            <ArrowDownUp className="h-3.5 w-3.5" />
            Reorder
          </Button>
        )}
      </div>

      {/* Grid */}
      {isReordering ? (
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            <div className={className}>
              {localItems.map(item => (
                <SortableCard key={item.id} id={item.id} isReordering={isReordering}>
                  {renderCard(item)}
                </SortableCard>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className={className}>
          {localItems.map(item => (
            <Fragment key={item.id}>{renderCard(item)}</Fragment>
          ))}
        </div>
      )}

      {/* Wiggle keyframes — injected once */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-0.7deg); }
          50% { transform: rotate(0.7deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
