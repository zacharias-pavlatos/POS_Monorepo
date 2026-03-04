'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { InsertWorkStationSchema } from '@repo/orpc/contracts';
import { Button, buttonVariants } from '@repo/ui/components/button';
import {
  TextField,
  TextareaField,
  SwitchField,
  ColorPickerField,
} from '@/components/form-fields';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/alert-dialog';
import { DangerZone } from '../form-fields/danger-zone';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const workstationFormSchema = InsertWorkStationSchema.omit({ id: true });
export type WorkstationFormValues = z.infer<typeof workstationFormSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type WorkstationFormProps = {
  defaultValues?: Partial<WorkstationFormValues>;
  onSubmit: (values: WorkstationFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onDelete?: () => void;
  isDeleting?: boolean;
};

export function WorkstationForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save',
  onDelete,
  isDeleting,
}: WorkstationFormProps) {
  const form = useForm<WorkstationFormValues>({
    resolver: zodResolver(workstationFormSchema),
    defaultValues: {
      name: '',
      description: null,
      isActive: true,
      color: null,
      displayOrder: 0,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <TextField
            field={field}
            fieldState={fieldState}
            label="Workstation Name"
            placeholder="e.g. Cold Kitchen"
            required
          />
        )}
      />

      <Controller
        name="description"
        control={form.control}
        render={({ field, fieldState }) => (
          <TextareaField
            field={field}
            fieldState={fieldState}
            label="Description"
            placeholder="Brief description of this workstation..."
            maxLength={1000}
          />
        )}
      />

      <Controller
        name="color"
        control={form.control}
        render={({ field, fieldState }) => (
          <ColorPickerField field={field} fieldState={fieldState} label="Color" />
        )}
      />

      <Controller
        name="isActive"
        control={form.control}
        render={({ field, fieldState }) => (
          <SwitchField
            field={field}
            fieldState={fieldState}
            label="Active"
            description="Make this workstation visible to customers"
          />
        )}
      />

      {onDelete && (
        <DangerZone
          actionLabel="Delete Workstation"
          description="Permanently delete this workstation and all its data."
          confirmTitle="Delete Workstation?"
          confirmDescription="This will permanently remove this workstation. Categories assigned to it will need to be reassigned. This action cannot be undone."
          onConfirm={onDelete}
          isLoading={isDeleting}
        />
      )}

      <Button type="submit" disabled={isSubmitting || isDeleting} className="flex-1">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
