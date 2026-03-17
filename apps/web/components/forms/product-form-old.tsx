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
  SelectField,
  CollapsibleSection,
} from '@/components/form-fields';
import { DangerZone } from '../form-fields/danger-zone';

import { InsertProductSchema } from '@repo/orpc/contracts';
import type { SelectWorkStationType as Workstation } from '@repo/orpc/contracts';
import { PriceField } from '../form-fields/price-field';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const productFormSchema = InsertProductSchema.omit({ id: true })
  .extend({
    fromDate: z.date(),
    toDate: z.date().nullable(),
  })
  .refine(data => !data.toDate || data.toDate >= data.fromDate, {
    message: 'End date must be after start date',
    path: ['toDate'],
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ProductFormProps = {
  defaultValues?: Partial<ProductFormValues>;
  workstations: Workstation[];
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  onDelete?: () => void;
  isDeleting?: boolean;
};

export function ProductForm({
  defaultValues,
  workstations,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save',
  onDelete,
  isDeleting,
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      workstationId: null,
      barcode: undefined,
      name: '',
      description: undefined,
      image: null,
      preparationTime: undefined,
      basePrice: 0,
      fromDate: new Date(),
      toDate: null,
      fromTime: undefined,
      toTime: undefined,
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
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <TextField
            field={field}
            fieldState={fieldState}
            label="Product Name"
            placeholder="e.g. Espresso"
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
            placeholder="Brief description of this product..."
            maxLength={1000}
          />
        )}
      />

      <Controller
        name="basePrice"
        control={form.control}
        render={({ field, fieldState }) => (
          <PriceField field={field} fieldState={fieldState} label="Price" required />
        )}
      />

      <Controller
        name="barcode"
        control={form.control}
        render={({ field, fieldState }) => (
          <TextField
            field={field}
            fieldState={fieldState}
            label="Barcode"
            placeholder="e.g. 5901234123457"
          />
        )}
      />

      <Controller
        name="preparationTime"
        control={form.control}
        render={({ field, fieldState }) => (
          <TextField
            field={{
              ...field,
              value: field.value != null ? String(field.value) : '',
              onChange: (val: string | null) => {
                const num = val ? parseInt(val, 10) : undefined;
                field.onChange(num != null && !isNaN(num) ? num : undefined);
              },
            }}
            fieldState={fieldState}
            label="Preparation Time (seconds)"
            placeholder="e.g. 300"
          />
        )}
      />

      <Controller
        name="workstationId"
        control={form.control}
        render={({ field, fieldState }) => (
          <SelectField
            field={{
              ...field,
              value: field.value,
              onChange: (val: string) => field.onChange(val === '__none__' ? null : val),
            }}
            fieldState={fieldState}
            label="Workstation Override"
            description="If set, this product always routes here regardless of category"
            placeholder="Use category default"
            options={[
              { value: '__none__', label: 'Use category default' },
              ...workstations.map(ws => ({
                value: ws.id,
                label: ws.name,
              })),
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
            description="Make this product available for ordering"
          />
        )}
      />

      <CollapsibleSection label="Scheduling" defaultOpen={hasSchedulingValues}>
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
      {onDelete && (
        <DangerZone
          actionLabel="Delete Product"
          description="Permanently delete this product and all its data."
          confirmTitle="Delete Product?"
          confirmDescription="This will permanently remove this product, including its modifier groups and any category associations. This action cannot be undone."
          onConfirm={onDelete}
          isLoading={isDeleting}
        />
      )}
      <Button type="submit" disabled={isSubmitting || isDeleting} className="w-full">
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
