'use client';

import { Plus } from 'lucide-react';

import { Button } from '@repo/ui/components/button';

import { SortableModifierOptionRow } from './sortable-modifier-option-row';

import type { SelectModifierType as Modifier } from '@repo/orpc/contracts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModifierOptionsListProps {
  modifiers: Modifier[];
  maxSelections: number | null;
  /** Wraps each option row — use for Sheet triggers, DnD wrappers, etc. */
  renderOptionWrapper?: (
    modifier: Modifier,
    children: React.ReactNode
  ) => React.ReactNode;
  /** Wraps the add button — use for Sheet triggers */
  renderAddWrapper?: (children: React.ReactNode) => React.ReactNode;
  /** Called when add is clicked (if no renderAddWrapper) */
  onAdd?: () => void;
  /** Called when an option row is clicked (if no renderOptionWrapper) */
  onOptionClick?: (modifier: Modifier) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SortableModifierOptionsList({
  modifiers,
  maxSelections,
  renderOptionWrapper,
  renderAddWrapper,
  onAdd,
  onOptionClick,
}: ModifierOptionsListProps) {
  const addButton = (
    <Button variant="outline" size="sm" className="w-full border-dashed">
      <Plus className="mr-1 h-4 w-4" />
      Add option
    </Button>
  );

  // Empty state
  if (modifiers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-4">
        <p className="text-muted-foreground text-xs">No options in this group.</p>
        {renderAddWrapper ? (
          renderAddWrapper(
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add option
            </Button>
          )
        ) : (
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus className="mr-1 h-4 w-4" />
            Add option
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="divide-border divide-y">
        {modifiers.map(modifier => {
          const row = (
            <SortableModifierOptionRow
              key={modifier.id}
              modifier={modifier}
              maxSelections={maxSelections}
              onClick={
                !renderOptionWrapper && onOptionClick
                  ? () => onOptionClick(modifier)
                  : undefined
              }
            />
          );

          return renderOptionWrapper ? renderOptionWrapper(modifier, row) : row;
        })}
      </div>
      <div className="border-border border-t px-4 py-2">
        {renderAddWrapper ? (
          renderAddWrapper(addButton)
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={onAdd}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add option
          </Button>
        )}
      </div>
    </>
  );
}
