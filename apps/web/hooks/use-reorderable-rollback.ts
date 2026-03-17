/**
 * A custom hook to manage state and logic for reorderable lists or grids.
 *
 * It tracks the active `reorderMode`, `isDragging` status, and `isPending` (saving) state.
 * Upon entering reorder mode, it captures a snapshot of the initial items order.
 * This allows it to easily compute the `changeCount` and roll back to
 * the original layout if the reorder is cancelled.
 */

'use client';

import { useState, useRef, useCallback } from 'react';

export function useReorderableRollback<T extends { id: string }>(
  items: T[],
  onReorder: (items: T[]) => void
) {
  const [reorderMode, setReorderMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const snapshotRef = useRef<T[] | null>(null);

  // Snapshot on enter, clear on exit
  if (reorderMode && !snapshotRef.current) {
    snapshotRef.current = items;
  }
  if (!reorderMode && snapshotRef.current) {
    snapshotRef.current = null;
  }

  const changeCount = snapshotRef.current
    ? items.filter((item, i) => item.id !== snapshotRef.current![i]?.id).length
    : 0;

  const cancel = useCallback(() => {
    if (snapshotRef.current) onReorder(snapshotRef.current);
    snapshotRef.current = null;
    setReorderMode(false);
  }, [onReorder]);

  const save = useCallback(async (onSave?: () => Promise<void>) => {
    setIsPending(true);
    try {
      await onSave?.();
      snapshotRef.current = null;
      setReorderMode(false);
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    reorderMode,
    isDragging,
    isPending,
    changeCount,
    setReorderMode,
    setIsDragging,
    cancel,
    save,
  };
}
