/**
 *
 * This component is a wrapper around the ReorderableCardGrid component.
 * It provides a way to reorder the items in the grid and save the changes.
 * It also provides a way to cancel the reorder operation.
 *
 */

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ReorderableCardGrid } from '@/components/card-grid-reorder-mode/reordable-card-grid';
import { ReorderActionBar } from '@/components/reorder-action-bar';

interface ReorderableCardsProps<T extends { id: string }> {
  items: T[];
  renderItem: (item: T, isReorderMode: boolean) => React.ReactNode;
  reorderMode: boolean;
  onReorderModeChange: (active: boolean) => void;
  onReorder: (items: T[]) => void;
  onSave?: () => void | Promise<void>;
  className?: string;
}

export function ReorderableCards<T extends { id: string }>({
  items,
  renderItem,
  reorderMode,
  onReorderModeChange,
  onReorder,
  onSave,
  className,
}: ReorderableCardsProps<T>) {
  const [isDragging, setIsDragging] = useState(false);
  const snapshotRef = useRef<T[] | null>(null);
  const [isPending, setIsPending] = useState(false);

  if (reorderMode && !snapshotRef.current) {
    snapshotRef.current = items;
  }

  const changeCount = snapshotRef.current
    ? items.filter((item, i) => item.id !== snapshotRef.current![i]?.id).length
    : 0;

  const handleCancel = () => {
    if (snapshotRef.current) onReorder(snapshotRef.current);
    snapshotRef.current = null;
    onReorderModeChange(false);
  };

  const handleSave = async () => {
    setIsPending(true); // ← bar shows "Saving…"
    try {
      await onSave?.(); // ← waits for mutation to finish
      snapshotRef.current = null;
      onReorderModeChange(false);
    } finally {
      setIsPending(false); // ← bar resets
    }
  };

  return (
    <>
      <ReorderableCardGrid
        className={className}
        items={items}
        renderItem={item => renderItem(item, reorderMode)}
        disabled={!reorderMode}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        onReorder={onReorder}
      />

      {reorderMode && !isDragging && (
        <ReorderActionBar
          changeCount={changeCount}
          onCancel={handleCancel}
          onSave={handleSave}
          isPending={isPending}
        />
      )}
    </>
  );
}
