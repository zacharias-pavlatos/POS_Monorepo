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

import { ModifierGroupForm, type ModifierGroupFormValues } from './modifier-group-form';

import type { SelectModifierGroupType as ModifierGroup } from '@repo/orpc/contracts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModifierGroupSheetProps {
  productId: string;
  modifierGroup?: ModifierGroup; // undefined = create, defined = edit
  children: React.ReactNode; // trigger element
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ModifierGroupSheet({
  productId,
  modifierGroup,
  children,
}: ModifierGroupSheetProps) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const isEditingMode = !!modifierGroup;

  const upsertMutation = useMutation({
    mutationFn: async (values: ModifierGroupFormValues) => {
      return isEditingMode
        ? rpcClient.modifierGroups.update({ id: modifierGroup.id, ...values })
        : rpcClient.modifierGroups.create({ ...values, productId });
    },
    onSuccess: async () => {
      toast.success(isEditingMode ? 'Group updated' : 'Group created');
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['modifierGroups'] });
    },
    onError: () => {
      toast.error(isEditingMode ? 'Failed to update group' : 'Failed to create group');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return rpcClient.modifierGroups.delete({ id });
    },
    onSuccess: async () => {
      toast.success('Group deleted');
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['modifierGroups'] });
    },
    onError: () => {
      toast.error('Failed to delete group');
    },
  });

  function handleSubmit(values: ModifierGroupFormValues) {
    upsertMutation.mutate(values);
  }

  function handleDelete() {
    if (!modifierGroup) return;
    deleteMutation.mutate(modifierGroup.id);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditingMode ? 'Edit Group' : 'New Modifier Group'}</SheetTitle>
          <SheetDescription>
            {isEditingMode
              ? "Update this group's settings."
              : 'Create a new modifier group for this product.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4">
          <ModifierGroupForm
            key={modifierGroup?.id ?? 'create'}
            defaultValues={modifierGroup}
            onSubmit={handleSubmit}
          >
            {isEditingMode && (
              <DangerZone
                actionLabel="Delete Group"
                description="Permanently delete this group and all its options."
                confirmTitle="Delete Group?"
                confirmDescription="This will permanently remove this modifier group and all its options. This action cannot be undone."
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
              />
            )}

            <SheetFooter className="px-0 pb-4">
              <Button
                type="submit"
                disabled={upsertMutation.isPending}
                className="w-full"
              >
                {upsertMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                {isEditingMode ? 'Save Changes' : 'Create Group'}
              </Button>
            </SheetFooter>
          </ModifierGroupForm>
        </div>
      </SheetContent>
    </Sheet>
  );
}
