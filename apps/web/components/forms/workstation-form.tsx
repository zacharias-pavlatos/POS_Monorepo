'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { InsertWorkStationSchema } from '@repo/orpc/contracts';
import { Button, buttonVariants } from '@repo/ui/components/button';
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
import {
  TextField,
  TextareaField,
  SwitchField,
  ColorPickerField,
} from '@/components/form-fields';

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
            placeholder="e.g. Hot Kitchen"
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
            placeholder="Brief description of this catalog..."
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
            description="Make this catalog visible to customers"
          />
        )}
      />

      <div className="flex gap-2">
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting || isSubmitting}
                className="flex-1"
              >
                {isDeleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete workstation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Categories assigned to this workstation
                  will need to be reassigned.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className={buttonVariants({ variant: 'destructive' })}
                  onClick={onDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || isDeleting}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
