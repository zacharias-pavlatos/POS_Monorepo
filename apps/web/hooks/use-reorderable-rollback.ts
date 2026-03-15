// hooks/use-reorderable-rollback.ts
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
