// components/reorder-action-bar.tsx
'use client';

import {
  FloatingBar,
  FloatingBarContent,
  FloatingBarBadge,
  FloatingBarMessage,
  FloatingBarSeparator,
  FloatingBarActions,
} from '@/components/floating-bar';
import { Button } from '@repo/ui/components/button';
import { Loader2 } from 'lucide-react';

interface ReorderActionBarProps {
  changeCount: number;
  onCancel: () => void;
  onSave: () => void;
  isPending?: boolean;
}

export function ReorderActionBar({
  changeCount,
  onCancel,
  onSave,
  isPending = false,
}: ReorderActionBarProps) {
  return (
    <FloatingBar>
      <FloatingBarContent>
        {changeCount > 0 && <FloatingBarBadge>{changeCount}</FloatingBarBadge>}
        <FloatingBarMessage>
          {changeCount === 0
            ? 'Drag and drop to reorder'
            : changeCount === 1
              ? 'item moved'
              : 'items moved'}
        </FloatingBarMessage>
      </FloatingBarContent>
      <FloatingBarSeparator />
      <FloatingBarActions>
        {!isPending && (
          <Button
            // variant="outline"
            size="sm"
            className="text-background rounded-full hover:text-red-400"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        {changeCount > 0 && (
          <Button
            size="sm"
            className="bg-background text-foreground hover:bg-background/90 rounded-full disabled:opacity-100"
            onClick={onSave}
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        )}
      </FloatingBarActions>
    </FloatingBar>
  );
}
