'use client';

import {
  Fragment,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Check, X } from 'lucide-react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '@repo/ui/components/button';

interface SortableCardProps {
  id: string;
  isDragArmed: boolean;
  isDraggingGlobal: boolean;
  pressedId: string | null;
  bounceId: string | null;
  onPressStart: (id: string) => void;
  onPressEnd: () => void;
  children: ReactNode;
}

function SortableCard({
  id,
  isDragArmed,
  isDraggingGlobal,
  pressedId,
  bounceId,
  onPressStart,
  onPressEnd,
  children,
}: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const isPressed = pressedId === id;
  const isBouncing = bounceId === id;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onPointerDown={() => onPressStart(id)}
      onPointerUp={onPressEnd}
      onPointerCancel={onPressEnd}
      onPointerLeave={onPressEnd}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={
        isDragArmed || isDraggingGlobal ? 'cursor-grab active:cursor-grabbing' : ''
      }
    >
      <div
        className={[
          'transition-[transform,opacity] duration-150',
          isPressed ? 'opacity-70' : '',
          isBouncing ? 'animate-press-bounce' : '',
          isDragArmed && !isDragging && !isPressed ? 'animate-wiggle' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </div>
  );
}

interface ReorderableCardGridProps<TData extends { id: string }> {
  items: TData[];
  renderCard: (item: TData) => React.ReactNode;
  onReorder?: (reordered: TData[]) => void;
  className?: string;
}

type SaveBarState = 'hidden' | 'entering' | 'visible' | 'exiting';

export function ReorderableCardGrid<TData extends { id: string }>({
  items,
  renderCard,
  onReorder,
  className = 'grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3',
}: ReorderableCardGridProps<TData>) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragArmed, setIsDragArmed] = useState(false);

  const [localItems, setLocalItems] = useState(items);
  const snapshotRef = useRef<TData[]>(items);

  const [pressedId, setPressedId] = useState<string | null>(null);
  const [bounceId, setBounceId] = useState<string | null>(null);

  const [saveBarState, setSaveBarState] = useState<SaveBarState>('hidden');

  const bounceTimerRef = useRef<number | null>(null);
  const armedTimerRef = useRef<number | null>(null);
  const saveBarTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (saveBarState === 'hidden' && !isDragging) {
      setLocalItems(items);
      snapshotRef.current = items;
    }
  }, [items, saveBarState, isDragging]);

  useEffect(() => {
    return () => {
      if (bounceTimerRef.current) window.clearTimeout(bounceTimerRef.current);
      if (armedTimerRef.current) window.clearTimeout(armedTimerRef.current);
      if (saveBarTimerRef.current) window.clearTimeout(saveBarTimerRef.current);
    };
  }, []);

  const sortableId = useId();

  // Bounce at 100ms, ready-to-drag at 200ms.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const itemIds = useMemo<UniqueIdentifier[]>(
    () => localItems.map(item => item.id),
    [localItems]
  );

  const pendingChangesCount = useMemo(() => {
    const originalIds = snapshotRef.current.map(item => item.id);
    const currentIds = localItems.map(item => item.id);

    let changes = 0;

    for (let i = 0; i < currentIds.length; i++) {
      if (currentIds[i] !== originalIds[i]) {
        changes++;
      }
    }

    return changes;
  }, [localItems]);

  const showSaveBar = saveBarState !== 'hidden';

  function clearPressTimers() {
    if (bounceTimerRef.current) {
      window.clearTimeout(bounceTimerRef.current);
      bounceTimerRef.current = null;
    }

    if (armedTimerRef.current) {
      window.clearTimeout(armedTimerRef.current);
      armedTimerRef.current = null;
    }
  }

  function clearSaveBarTimer() {
    if (saveBarTimerRef.current) {
      window.clearTimeout(saveBarTimerRef.current);
      saveBarTimerRef.current = null;
    }
  }

  function resetPressVisuals() {
    setPressedId(null);
    setBounceId(null);
  }

  function resetArmedState() {
    setIsDragArmed(false);
  }

  function openSaveBar() {
    clearSaveBarTimer();
    setSaveBarState('entering');

    saveBarTimerRef.current = window.setTimeout(() => {
      setSaveBarState('visible');
      saveBarTimerRef.current = null;
    }, 240);
  }

  function closeSaveBar() {
    clearSaveBarTimer();

    if (saveBarState === 'hidden') return;

    setSaveBarState('exiting');

    saveBarTimerRef.current = window.setTimeout(() => {
      setSaveBarState('hidden');
      saveBarTimerRef.current = null;
    }, 170);
  }

  function handlePressStart(id: string) {
    if (isDragging) return;

    clearPressTimers();
    resetPressVisuals();
    resetArmedState();

    setPressedId(id);

    bounceTimerRef.current = window.setTimeout(() => {
      setBounceId(id);
    }, 100);

    armedTimerRef.current = window.setTimeout(() => {
      setIsDragArmed(true);
    }, 200);
  }

  function handlePressEnd() {
    if (isDragging) return;

    clearPressTimers();
    resetPressVisuals();
    resetArmedState();
  }

  function handleDragStart(_event: DragStartEvent) {
    clearPressTimers();
    resetPressVisuals();
    closeSaveBar();
    setIsDragging(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setIsDragging(false);
    resetArmedState();
    resetPressVisuals();

    if (active && over && active.id !== over.id) {
      setLocalItems(prev => {
        const oldIndex = prev.findIndex(item => item.id === active.id);
        const newIndex = prev.findIndex(item => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return prev;

        return arrayMove(prev, oldIndex, newIndex);
      });
    }

    openSaveBar();
  }

  function handleDragCancel() {
    setIsDragging(false);
    resetArmedState();
    resetPressVisuals();
    openSaveBar();
  }

  function applyReorder() {
    snapshotRef.current = localItems;
    closeSaveBar();
    onReorder?.(localItems);
  }

  function cancelReorder() {
    clearPressTimers();
    resetPressVisuals();
    resetArmedState();
    setLocalItems(snapshotRef.current);
    setIsDragging(false);
    closeSaveBar();
  }

  if (!onReorder) {
    return (
      <div className={className}>
        {items.map(item => (
          <Fragment key={item.id}>{renderCard(item)}</Fragment>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          sensors={sensors}
          id={sortableId}
        >
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            <div className={className}>
              {localItems.map(item => (
                <SortableCard
                  key={item.id}
                  id={item.id}
                  isDragArmed={isDragArmed}
                  isDraggingGlobal={isDragging}
                  pressedId={pressedId}
                  bounceId={bounceId}
                  onPressStart={handlePressStart}
                  onPressEnd={handlePressEnd}
                >
                  {renderCard(item)}
                </SortableCard>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {showSaveBar && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div
            className={[
              'pointer-events-auto transform-gpu will-change-transform',
              saveBarState === 'entering' && 'animate-island-in',
              saveBarState === 'visible' && 'translate-y-0 scale-100 opacity-100',
              saveBarState === 'exiting' && 'animate-island-out',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="bg-background/90 supports-[backdrop-filter]:bg-background/70 flex min-h-12 items-center gap-3 rounded-full border px-3 py-2 shadow-lg backdrop-blur-xl">
              <div
                className={[
                  'text-muted-foreground text-xs transition-all duration-200',
                  saveBarState === 'entering'
                    ? 'animate-island-content-in'
                    : saveBarState === 'visible'
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-1 opacity-0',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {pendingChangesCount === 0
                  ? 'No changes'
                  : pendingChangesCount === 1
                    ? '1 change pending'
                    : `${pendingChangesCount} changes pending`}
              </div>

              <div
                className={[
                  'flex items-center gap-2 transition-all duration-200',
                  saveBarState === 'entering'
                    ? 'animate-island-content-in'
                    : saveBarState === 'visible'
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-1 opacity-0',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={cancelReorder}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>

                <Button size="sm" className="gap-1.5" onClick={applyReorder}>
                  <Check className="h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-0.7deg); }
          50% { transform: rotate(0.7deg); }
        }

        @keyframes press-bounce {
          0% { transform: scale(1); }
          50% { transform: scale(0.7); }
          100% { transform: scale(1); }
        }

        @keyframes island-in {
          0% {
            opacity: 0;
            transform: translate3d(0, 20px, 0) scaleX(0.22) scaleY(0.32);
          }
          55% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scaleX(1.03) scaleY(1.02);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scaleX(1) scaleY(1);
          }
        }

        @keyframes island-out {
          0% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scaleX(1) scaleY(1);
          }
          100% {
            opacity: 0;
            transform: translate3d(0, 16px, 0) scaleX(0.3) scaleY(0.36);
          }
        }

        @keyframes island-content-in {
          0% {
            opacity: 0;
            transform: translateY(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out infinite;
        }

        .animate-press-bounce {
          animation: press-bounce 0.1s ease-in-out 1;
        }

        .animate-island-in {
          animation: island-in 240ms cubic-bezier(0.2, 0.9, 0.25, 1.15) forwards;
        }

        .animate-island-out {
          animation: island-out 170ms cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        .animate-island-content-in {
          animation: island-content-in 160ms ease-out forwards;
          animation-delay: 70ms;
        }
      `}</style>
    </>
  );
}
