'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { Button } from '@repo/ui/components/button';
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

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const catalogFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().max(1000),
  internalNotes: z.string().max(1000),
  fromDate: z.date(),
  toDate: z.date().nullable(),
  fromTime: z.string(),
  toTime: z.string(),
  weekDays: z.array(z.number()).nullable(),
  isActive: z.boolean(),
  color: z.string().nullable(),
  image: z.any().nullable(),
});

export type CatalogFormValues = z.infer<typeof catalogFormSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type CatalogFormProps = {
  defaultValues?: Partial<CatalogFormValues>;
  onSubmit: (values: CatalogFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
};

export function CatalogForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save',
}: CatalogFormProps) {
  const form = useForm<CatalogFormValues>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: {
      name: '',
      description: '',
      internalNotes: '',
      fromDate: new Date(),
      toDate: null,
      fromTime: '',
      toTime: '',
      weekDays: [],
      isActive: true,
      color: null,
      image: null,
      ...defaultValues,
    },
  });

  const watchFromDate = form.watch('fromDate');

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

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
