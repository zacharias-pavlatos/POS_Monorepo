'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, MoreHorizontal, Copy } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@repo/ui/components/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/ui/components/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { rpcClient } from '@/lib/rpc-client';
import type { SelectModifierType as Modifier } from '@repo/orpc/contracts';
import { ModifierOptionSheet } from '@/components/forms/modifiers/modifier-option-form-sheet';
import { formatPrice } from '@/utils/format-price';
import { ModifierGroupSheet } from '@/components/forms/modifiers/modifier-group-form-sheet';
import { ModifierOptionRow } from './_components/modifier-option-row';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  rectIntersection,
  pointerWithin,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { SortableModifierOptionRow } from './_components/sortable-modifier-option-row';

const PRODUCT_ID = 'b8b746f2-0413-413e-9ca1-68af674417e3';

function ModifierGroupsPage() {
  const { data: product, isLoading } = useQuery({
    queryKey: ['modifierGroups'],
    queryFn: () =>
      rpcClient.products.oneWithModifiers({
        id: PRODUCT_ID,
      }),
  });

  const modifierGroups = product?.modifierGroups ?? [];
  const queryClient = useQueryClient();

  // TODO: Wire these to your preferred pattern (sheet, navigation, etc.)
  function handleEditGroup(id: string) {}
  function handleDuplicateGroup(id: string) {}
  function handleDeleteGroup(id: string) {}

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleOptionDragEnd(groupId: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const group = modifierGroups.find(g => g.id === groupId);
    const options = group?.modifiers ?? [];

    const oldIndex = options.findIndex(m => m.id === active.id);
    const newIndex = options.findIndex(m => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(options, oldIndex, newIndex);
    // const orderedIds = reordered.map(m => m.id);

    queryClient.setQueryData(['modifierGroups'], (old: typeof product) => {
      if (!old) return old;

      return {
        ...old,
        modifierGroups: old.modifierGroups.map(g =>
          g.id === groupId ? { ...g, modifiers: reordered } : g
        ),
      };
    });
    // reorderOptionsMutation.mutate({ modifierGroupId: groupId, orderedIds });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Modifier Groups</h1>
          <p className="text-muted-foreground text-sm">
            Manage customization options like sizes, toppings, and extras.
          </p>
        </div>

        <ModifierGroupSheet productId={PRODUCT_ID}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add modifier
          </Button>
        </ModifierGroupSheet>
      </div>

      {/* Empty state */}
      {modifierGroups.length === 0 && !isLoading && (
        <div className="border-border flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground mb-4 text-sm">No modifier groups yet.</p>
          <ModifierGroupSheet productId={PRODUCT_ID}>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create your first modifier
            </Button>
          </ModifierGroupSheet>
        </div>
      )}

      {/* Groups accordion */}
      {modifierGroups.length > 0 && (
        <Accordion
          type="multiple"
          className="space-y-2"
          defaultValue={modifierGroups.map(g => g.id)}
        >
          {modifierGroups.map(group => {
            const modifiers = group.modifiers ?? [];

            return (
              <AccordionItem
                key={group.id}
                value={group.id}
                className="border-border relative rounded-lg border"
              >
                <div className="flex flex-1 items-center justify-between gap-2">
                  <div className="flex-1">
                    <AccordionTrigger className="flex-1 px-4 py-3 hover:no-underline">
                      <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {group.name}
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              group.isRequired
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {group.isRequired ? 'Required' : 'Optional'}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {modifiers.length} option
                          {modifiers.length !== 1 ? 's' : ''}
                          {' · '}
                          {formatSelections(
                            group.isRequired,
                            group.minSelections,
                            group.maxSelections
                          )}
                          {group.description && ` · ${group.description}`}
                        </p>
                      </div>
                    </AccordionTrigger>
                  </div>

                  {/* Group actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute top-0 right-0 h-8 w-8 shrink-0 translate-x-1/2 -translate-y-1/2 rounded-full"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <ModifierGroupSheet productId={PRODUCT_ID} modifierGroup={group}>
                        <DropdownMenuItem
                          onSelect={e => {
                            e.preventDefault();
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit group
                        </DropdownMenuItem>
                      </ModifierGroupSheet>
                      <ModifierOptionSheet groupId={group.id}>
                        <DropdownMenuItem onSelect={e => e.preventDefault()}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add option
                        </DropdownMenuItem>
                      </ModifierOptionSheet>
                      <DropdownMenuItem onClick={() => handleDuplicateGroup(group.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <AccordionContent>
                  <div className="border-border border-t">
                    {modifiers.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-4 py-4">
                        <p className="text-muted-foreground text-xs">
                          No options in this group.
                        </p>
                        <ModifierOptionSheet groupId={group.id}>
                          <Button variant="outline" size="sm">
                            <Plus className="mr-1 h-4 w-4" />
                            Add option
                          </Button>
                        </ModifierOptionSheet>
                      </div>
                    ) : (
                      <>
                        <DndContext
                          sensors={sensors}
                          collisionDetection={pointerWithin}
                          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                          onDragEnd={event => handleOptionDragEnd(group.id, event)}
                        >
                          <SortableContext
                            items={modifiers.map(m => m.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="divide-border divide-y">
                              {modifiers.map(modifier => (
                                <ModifierOptionSheet
                                  key={modifier.id}
                                  groupId={group.id}
                                  modifier={modifier}
                                >
                                  <SortableModifierOptionRow
                                    modifier={modifier}
                                    maxSelections={group.maxSelections}
                                  />
                                </ModifierOptionSheet>
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                        <div className="border-border border-t px-4 py-2">
                          <ModifierOptionSheet groupId={group.id}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-dashed"
                            >
                              <Plus className="mr-1 h-4 w-4" />
                              Add option
                            </Button>
                          </ModifierOptionSheet>
                        </div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

export default ModifierGroupsPage;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSelections(isRequired: boolean, min: number, max: number | null): string {
  if (isRequired) return `Pick ${min}–${max ?? '∞'}`;
  return `Up to ${max ?? '∞'}`;
}
