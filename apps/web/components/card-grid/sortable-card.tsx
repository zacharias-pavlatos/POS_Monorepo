/**
 * A highly interactive sortable card component for grid-based reordering.
 *
 * Implements a "long-press" gesture (250ms based on the Dnd Sensor delay) to initiate dragging, allowing
 * for natural scrolling on mobile. Includes coordinated visual feedback:
 * - Cards shrink slightly during the initial hold.
 * - All cards "wiggle" once reordering is active.
 * - The dragged item "pops" and becomes semi-transparent.
 */

'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
import { cn } from '@repo/ui/lib/utils';
import { CSS } from '@dnd-kit/utilities';

interface SortableCardProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SortableCard({ id, children, disabled = false }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });
  // Access the global drag state to tell cards to wiggle
  const { active } = useDndContext();
  const isReorderingActive = Boolean(active);

  /*
   * This exists because of a **mouse-only browser behavior**.

   * On touch devices, when you long-press, drag, and release, the browser does not synthesize a `click` event.
   * So the `onClick` on the card wrapper never fires. No problem.
   *
   * On desktop with a mouse, the story is different.
   * The sequence is: `mousedown` → mouse moves 5px → drag sensor activates → user drops → `mouseup` → **browser always fires `click`**.
   * The mouse sensor's `distance: 5` constraint only controls when the drag starts — it doesn't suppress the click on release.
   * So without the interceptor, every drag-and-drop on desktop would also navigate to the product page.
   *
   * `onClickCapture` runs in the **capture phase**, which fires top-down before the bubble phase.
   * Since it's on the `SortableCard` wrapper (the outermost div), it intercepts the click before it reaches the inner `<div onClick>` on the card.
   * If a drag just happened (`wasDraggedRef.current` is true), it calls `e.stopPropagation()` to kill the event.
   * If no drag happened (a normal click), it does nothing and the click propagates normally to trigger navigation.
   */

  const wasDraggedRef = useRef(false);

  useEffect(() => {
    if (isDragging) wasDraggedRef.current = true;
  }, [isDragging]);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (wasDraggedRef.current) {
      e.preventDefault(); // blocks <a> default navigation
      e.stopPropagation(); // blocks onClick handlers
      wasDraggedRef.current = false;
    }
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
      onClickCapture={handleClickCapture}
      className={cn('group relative outline-none select-none', isDragging && 'z-10')}
    >
      <div
        className={cn(
          'press-scale',
          isReorderingActive && !isDragging && 'custom-wiggle',
          isDragging && 'scale-95 opacity-85',
          disabled && 'press-scale-disabled'
        )}
      >
        {children}
      </div>
    </div>
  );
}
