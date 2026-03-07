"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDraggableContext } from "./drag-handle"

interface DraggableCardProps {
  id: string
  children: React.ReactNode
}

export function DraggableCard({ id, children }: DraggableCardProps) {
  const { disabled } = useDraggableContext()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={disabled ? "" : "cursor-grab active:cursor-grabbing"}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      {children}
    </div>
  )
}
