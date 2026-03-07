'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/components/tooltip';

// ── Context for DnD state ───────────────────────────────────────────────────

interface DraggableContextValue {
  disabled: boolean;
  reason?: string;
}

const DraggableContext = React.createContext<DraggableContextValue>({
  disabled: false,
});

export function DraggableProvider({
  disabled,
  reason,
  children,
}: DraggableContextValue & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ disabled, reason }), [disabled, reason]);
  return <DraggableContext.Provider value={value}>{children}</DraggableContext.Provider>;
}

export function useDraggableContext() {
  return React.useContext(DraggableContext);
}

// ── DragHandle ──────────────────────────────────────────────────────────────

interface DragHandleProps {
  id: string;
  disabled?: boolean;
}

export function DragHandle({ id, disabled: disabledProp }: DragHandleProps) {
  const ctx = useDraggableContext();
  const disabled = disabledProp ?? ctx.disabled;

  const { attributes, listeners } = useSortable({ id, disabled });

  if (disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex size-7 cursor-not-allowed items-center justify-center">
            <GripVertical className="text-muted-foreground/30 size-3.5" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {ctx.reason ?? 'Clear sort and filters to reorder'}
        </TooltipContent>
      </Tooltip>
    );
  }

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
