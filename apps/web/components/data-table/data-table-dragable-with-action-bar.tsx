// data-table-reorderable.tsx
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { Table } from '@tanstack/react-table';
import { DraggableTable } from './data-table-dragable';
import { ReorderActionBar } from '@/components/reorder-action-bar';

interface DataTableReorderableProps<TData extends { id: string }> {
  table: Table<TData>;
  reorderMode: boolean;
  onReorderModeChange: (active: boolean) => void;
  onReorder: (items: TData[]) => void;
  onSave?: () => void | Promise<void>;
}

export function DataTableReorderable<TData extends { id: string }>({
  table,
  reorderMode,
  onReorderModeChange,
  onReorder,
  onSave,
}: DataTableReorderableProps<TData>) {
  const [isDragging, setIsDragging] = useState(false);
  const snapshotRef = useRef<TData[] | null>(null);
  const [isPending, setIsPending] = useState(false);

  const items = table.getRowModel().rows.map(r => r.original);

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
    setIsPending(true);
    try {
      await onSave?.();
      snapshotRef.current = null;
      onReorderModeChange(false);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <DraggableTable
        table={table}
        onReorder={onReorder}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        // disabled={!reorderMode}
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
