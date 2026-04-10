'use client';

import * as React from 'react';
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@repo/ui/components/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@repo/ui/components/sheet';

import {
  ModifierGroupForm,
  type ModifierGroupFormValues,
} from '@/components/forms/modifiers/modifier-group-form';
import {
  ModifierOptionForm,
  type ModifierOptionFormValues,
} from '@/components/forms/modifiers/modifier-option-form';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModifierOption = ModifierOptionFormValues & {
  /** Client-side key for React list rendering */
  _key: string;
  displayOrder: number;
};

type ModifierGroupEditorProps = {
  /** Pre-existing group values for edit mode */
  defaultGroupValues?: Partial<ModifierGroupFormValues>;
  /** Pre-existing options for edit mode */
  defaultOptions?: ModifierOptionFormValues[];
  /** Called with the complete payload (group + options) */
  onSave: (payload: {
    group: ModifierGroupFormValues;
    options: Omit<ModifierOption, '_key'>[];
  }) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let optionKeyCounter = 0;
function nextKey() {
  return `opt_${++optionKeyCounter}`;
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Included';
  return `+€${(cents / 100).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ModifierGroupEditor({
  defaultGroupValues,
  defaultOptions = [],
  onSave,
  isSubmitting = false,
  submitLabel = 'Save group',
}: ModifierGroupEditorProps) {
  // ── Options state ────────────────────────────────────────────────────
  const [options, setOptions] = React.useState<ModifierOption[]>(() =>
    defaultOptions.map((opt, i) => ({ ...opt, _key: nextKey(), displayOrder: i }))
  );

  // ── Drawer state: null = closed, -1 = new, 0+ = editing index ───────
  const [drawerIndex, setDrawerIndex] = React.useState<number | null>(null);
  const isDrawerOpen = drawerIndex !== null;
  const isEditing = drawerIndex !== null && drawerIndex >= 0;

  const drawerDefaultValues: Partial<ModifierOptionFormValues> | undefined =
    isEditing && drawerIndex != null ? options[drawerIndex] : undefined;

  // ── Option handlers ──────────────────────────────────────────────────
  function handleAddOption() {
    setDrawerIndex(-1);
  }

  function handleEditOption(index: number) {
    setDrawerIndex(index);
  }

  function handleOptionSave(values: ModifierOptionFormValues) {
    if (isEditing && drawerIndex != null) {
      setOptions(prev =>
        prev.map((opt, i) =>
          i === drawerIndex
            ? { ...values, _key: opt._key, displayOrder: opt.displayOrder }
            : opt
        )
      );
    } else {
      setOptions(prev => [
        ...prev,
        { ...values, _key: nextKey(), displayOrder: prev.length },
      ]);
    }
    setDrawerIndex(null);
  }

  function handleRemoveOption(index: number) {
    setOptions(prev => prev.filter((_, i) => i !== index));
  }

  function handleDrawerClose() {
    setDrawerIndex(null);
  }

  // ── Group form submit → combine group + options → call parent ────────
  function handleGroupSubmit(groupValues: ModifierGroupFormValues) {
    const payload = {
      group: groupValues,
      options: options.map(({ _key, ...rest }) => rest),
    };
    return onSave(payload);
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="grid gap-6">
      {/* Group form */}
      <ModifierGroupForm defaultValues={defaultGroupValues} onSubmit={handleGroupSubmit}>
        {/* Options list lives inside the form's children slot,
            but is NOT a nested form — just UI elements */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Options</span>
            <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
              <Plus className="mr-1 h-4 w-4" />
              Add option
            </Button>
          </div>

          {options.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No options yet. Add one to get started.
            </p>
          ) : (
            <div className="divide-border divide-y rounded-lg border">
              {options.map((option, index) => (
                <div key={option._key} className="flex items-center gap-2 px-3 py-2.5">
                  <GripVertical className="text-muted-foreground h-4 w-4 shrink-0 cursor-grab" />

                  <span className="flex-1 truncate text-sm font-medium">
                    {option.name || 'Untitled option'}
                  </span>

                  <div className="flex items-center gap-2">
                    {option.isDefault && (
                      <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                        Default
                      </span>
                    )}
                    {!option.isActive && (
                      <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-medium">
                        Inactive
                      </span>
                    )}
                    <span className="text-muted-foreground font-mono text-xs">
                      {formatPrice(option.basePrice ?? 0)}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEditOption(index)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive h-7 w-7"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </ModifierGroupForm>

      {/* Option drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={open => !open && handleDrawerClose()}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{isEditing ? 'Edit option' : 'Add option'}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? 'Update this modifier option.'
                : 'Add a new modifier option to this group.'}
            </SheetDescription>
          </SheetHeader>

          {isDrawerOpen && (
            <ModifierOptionForm
              key={drawerIndex}
              defaultValues={drawerDefaultValues}
              onSubmit={handleOptionSave}
            >
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  {isEditing ? 'Update option' : 'Add option'}
                </Button>
                <Button type="button" variant="outline" onClick={handleDrawerClose}>
                  Cancel
                </Button>
              </div>
            </ModifierOptionForm>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
