import { useSortable } from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';
import { Button } from '@repo/ui/components/button';

export function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id });

  return (
    <Button
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
