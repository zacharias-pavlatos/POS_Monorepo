'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { toast } from '@repo/ui/components/sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@repo/ui/components/sheet';
import { Button } from '@repo/ui/components/button';

import { rpcClient } from '@/lib/rpc-client';
import { DangerZone } from '@/components/form-fields/danger-zone';

import {
  ModifierOptionForm,
  type ModifierOptionFormValues,
} from './modifier-option-form';

import type { SelectModifierType as Modifier } from '@repo/orpc/contracts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModifierOptionSheetProps {
  groupId: string;
  modifier?: Modifier; // undefined = create, defined = edit
  children: React.ReactNode; // trigger element
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ModifierOptionSheet({
  groupId,
  modifier,
  children,
}: ModifierOptionSheetProps) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const isEditingMode = !!modifier;

  const upsertMutation = useMutation({
    mutationFn: async (values: ModifierOptionFormValues) => {
      return isEditingMode
        ? rpcClient.modifiers.update({ id: modifier.id, ...values })
        : rpcClient.modifiers.create({ ...values, modifierGroupId: groupId });
    },
    onSuccess: async () => {
      toast.success(isEditingMode ? 'Option updated' : 'Option added');
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['modifierGroups'] });
    },
    onError: () => {
      toast.error(isEditingMode ? 'Failed to update option' : 'Failed to add option');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return rpcClient.modifiers.delete({ id });
    },
    onSuccess: async () => {
      toast.success('Option deleted');
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['modifierGroups'] });
    },
    onError: () => {
      toast.error('Failed to delete option');
    },
  });

  function handleSubmit(values: ModifierOptionFormValues) {
    upsertMutation.mutate(values);
  }

  function handleDelete() {
    if (!modifier) return;
    deleteMutation.mutate(modifier.id);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditingMode ? 'Edit Option' : 'Add Option'}</SheetTitle>
          <SheetDescription>
            {isEditingMode
              ? 'Update this modifier option.'
              : 'Add a new modifier option to this group.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4">
          <ModifierOptionForm
            key={modifier?.id ?? 'create'}
            defaultValues={modifier}
            onSubmit={handleSubmit}
          >
            {isEditingMode && (
              <DangerZone
                actionLabel="Delete Option"
                description="Permanently delete this modifier option."
                confirmTitle="Delete Option?"
                confirmDescription="This will permanently remove this modifier option. This action cannot be undone."
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
              />
            )}

            <SheetFooter className="pb-4">
              <Button
                type="submit"
                disabled={upsertMutation.isPending}
                className="w-full"
              >
                {upsertMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {isEditingMode ? 'Save Changes' : 'Add Option'}
              </Button>
            </SheetFooter>
          </ModifierOptionForm>
        </div>
      </SheetContent>
    </Sheet>
  );
}
