'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Trash2 } from 'lucide-react';
import { z } from 'zod';

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
  DatePickerField,
  TimeField,
  SwitchField,
  ImageUploadField,
  WeekDaysField,
  ColorPickerField,
  CollapsibleSection,
} from '@/components/form-fields';

import { InsertCatalogSchema } from '@repo/orpc/contracts';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
/**
 * z.coerce.date() infers as `unknown` since it accepts any input (string,
 * number, etc.). RHF needs `Date`, so we override with z.date() here.
 */
const catalogFormSchema = InsertCatalogSchema.omit({ id: true }).extend({
  fromDate: z.date(),
  toDate: z.date().nullable(),
});
export type CatalogFormValues = z.infer<typeof catalogFormSchema>;

type CatalogFormProps = {
  defaultValues?: Partial<CatalogFormValues>;
  onSubmit: (values: CatalogFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onDelete?: () => void;
  isDeleting?: boolean;
};

export function CatalogForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save',
  onDelete,
  isDeleting,
}: CatalogFormProps) {
  const form = useForm<CatalogFormValues>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: {
      name: '',
      description: '',
      internalNotes: '',
      fromDate: new Date(),
      toDate: null,
      fromTime: undefined,
      toTime: undefined,
      weekDays: [],
      isActive: true,
      color: null,
      image: null,
      ...defaultValues,
    },
  });

  const watchFromDate = form.watch('fromDate');

  // TODO: On edit its always true because of the defaultValues -> fromDate: new Date(), need to come up with something smarter
  const hasSchedulingValues = !!(
    defaultValues?.fromTime ||
    defaultValues?.toTime ||
    defaultValues?.fromDate ||
    defaultValues?.toDate ||
    (defaultValues?.weekDays && defaultValues.weekDays.length > 0)
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
      <Controller
        name="image"
        control={form.control}
        render={({ field, fieldState }) => (
          <ImageUploadField field={field} fieldState={fieldState} label="Image" />
        )}
      />

      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <TextField
            field={field}
            fieldState={fieldState}
            label="Catalog Name"
            placeholder="e.g. Summer Menu 2026"
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
        name="internalNotes"
        control={form.control}
        render={({ field, fieldState }) => (
          <TextareaField
            field={field}
            fieldState={fieldState}
            label="Internal Notes"
            placeholder="Notes visible only to your team..."
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

      <CollapsibleSection label="Advanced" defaultOpen={hasSchedulingValues}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="fromDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <DatePickerField
                field={field}
                fieldState={fieldState}
                label="Start Date"
                required
              />
            )}
          />
          <Controller
            name="toDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <DatePickerField
                field={field}
                fieldState={fieldState}
                label="End Date"
                disabledDates={date => (watchFromDate ? date < watchFromDate : false)}
              />
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="fromTime"
            control={form.control}
            render={({ field, fieldState }) => (
              <TimeField field={field} fieldState={fieldState} label="Start Time" />
            )}
          />
          <Controller
            name="toTime"
            control={form.control}
            render={({ field, fieldState }) => (
              <TimeField field={field} fieldState={fieldState} label="End Time" />
            )}
          />
        </div>

        <Controller
          name="weekDays"
          control={form.control}
          render={({ field, fieldState }) => (
            <WeekDaysField field={field} fieldState={fieldState} label="Days of Week" />
          )}
        />
      </CollapsibleSection>

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
                <AlertDialogTitle>Delete catalog?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All categories and products associated
                  with this catalog will lose their catalog assignment.
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
