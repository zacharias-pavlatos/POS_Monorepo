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
  SelectField,
  CollapsibleSection,
} from '@/components/form-fields';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().max(1000),
  internalNotes: z.string().max(1000),
  color: z.string().nullable(),
  image: z.any().nullable(),
  servingOrder: z.number(),
  fromDate: z.date(),
  toDate: z.date().nullable(),
  fromTime: z.string(),
  toTime: z.string(),
  weekDays: z.array(z.number()).nullable(),
  isActive: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type CategoryFormProps = {
  defaultValues?: Partial<CategoryFormValues>;
  onSubmit: (values: CategoryFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
};

export function CategoryForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save',
}: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      internalNotes: '',
      color: null,
      image: null,
      servingOrder: 0,
      fromDate: new Date(),
      toDate: null,
      fromTime: '',
      toTime: '',
      weekDays: [],
      isActive: true,
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
        name="color"
        control={form.control}
        render={({ field, fieldState }) => (
          <ColorPickerField field={field} fieldState={fieldState} label="Color" />
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
        name="servingOrder"
        control={form.control}
        render={({ field, fieldState }) => (
          <SelectField
            field={field}
            fieldState={fieldState}
            label="Serving Order"
            description="Which course this category fires with"
            placeholder="Select a course"
            options={[
              { value: '1', label: '1 - Appetizer' },
              { value: '2', label: '2 - Main Course' },
              { value: '3', label: '3 - Dessert' },
            ]}
          />
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
