'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { TextField, TextareaField, SwitchField } from '@/components/form-fields';
import { PriceField } from '@/components/form-fields/price-field';
import { InsertModifierSchema } from '@repo/orpc/contracts';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const modifierOptionFormSchema = InsertModifierSchema.omit({
  id: true,
  modifierGroupId: true,
  referencedProductId: true,
  displayOrder: true, // It will be set by the DnD reorder
});

export type ModifierOptionFormValues = z.infer<typeof modifierOptionFormSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ModifierOptionFormProps = {
  defaultValues?: Partial<ModifierOptionFormValues>;
  onSubmit: (values: ModifierOptionFormValues) => void | Promise<void>;
  children?: React.ReactNode;
};

export function ModifierOptionForm({
  defaultValues,
  onSubmit,
  children,
}: ModifierOptionFormProps) {
  const form = useForm<ModifierOptionFormValues>({
    resolver: zodResolver(modifierOptionFormSchema),
    defaultValues: {
      name: '',
      description: null,
      basePrice: 0,
      isDefault: false,
      isActive: true,
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
            label="Option Name"
            placeholder="e.g. Small, Large, Oat Milk"
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
            placeholder="Optional description..."
            maxLength={1000}
          />
        )}
      />

      <Controller
        name="basePrice"
        control={form.control}
        render={({ field, fieldState }) => (
          <PriceField
            field={field}
            fieldState={fieldState}
            label="Price Adjustment"
            description="0 = included in base price"
          />
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="isDefault"
          control={form.control}
          render={({ field, fieldState }) => (
            <SwitchField
              field={field}
              fieldState={fieldState}
              label="Default"
              description="Pre-selected in the UI"
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
              description="Available for selection"
            />
          )}
        />
      </div>

      {children}
    </form>
  );
}
