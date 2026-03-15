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

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { useDndContext } from '@dnd-kit/core';
import { cn } from '@repo/ui/lib/utils';
import { CSS } from '@dnd-kit/utilities';

interface SortableCardProps {
  id: string;
  children: React.ReactNode;
}

export function SortableCard({ id, children }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  // Access the global drag state to tell cards to wiggle
  const { active } = useDndContext();
  const isReorderingActive = Boolean(active);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className={cn('group relative outline-none select-none', isDragging && 'z-10')}
    >
      <div
        className={cn(
          'transition-all duration-200 ease-out',

          /* BOUNCE: Applied when the user presses down */
          'bounce-container active:delay-75',

          // WIGGLE: Starts at 250ms because 'active' (from useDndContext)
          // only becomes true when the sensor timer finishes.
          isReorderingActive && !isDragging && 'custom-wiggle',

          // POP: The item being dragged
          isDragging && 'scale-95 opacity-85'
        )}
      >
        {children}
      </div>

      <style>{`
       .group:active .bounce-container {
           animation: spring-down 0.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
            animation-delay: 80ms; 
          }

        @keyframes spring-down {
          0% { transform: scale(1); }
          40% { transform: scale(0.70); }
          100% { transform: scale(0.95); }
        }

        .custom-wiggle {
          animation: wiggle 0.3s ease-in-out infinite;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-0.8deg); }
          50% { transform: rotate(0.8deg); }
        }
      `}</style>
    </div>
  );
}
