'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { TextField, TextareaField, SwitchField } from '@/components/form-fields';
import { NumberField } from '@/components/form-fields/number-field';
import { InsertModifierGroupSchema } from '@repo/orpc/contracts';
import React from 'react';
import { SelectionTypeCards } from '@/app/(protected)/organizations/[orgId]/modifiers/_components/selection-type-cards';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const modifierGroupFormSchema = InsertModifierGroupSchema.omit({
  id: true,
  productId: true,
  displayOrder: true, // It will be set by the DnD reorder
}).refine(
  data => {
    if (data.maxSelections != null && data.minSelections != null) {
      return data.minSelections <= data.maxSelections;
    }
    return true;
  },
  {
    message: 'Min selections cannot exceed max selections',
    path: ['minSelections'],
  }
);

export type ModifierGroupFormValues = z.infer<typeof modifierGroupFormSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type ModifierGroupFormProps = {
  defaultValues?: Partial<ModifierGroupFormValues>;
  onSubmit: (values: ModifierGroupFormValues) => void | Promise<void>;
  children?: React.ReactNode;
};

type SelectionMode = 'single' | 'multiple';

function deriveMode(maxSelections: number | null | undefined): SelectionMode {
  return maxSelections === 1 ? 'single' : 'multiple';
}

export function ModifierGroupForm({
  defaultValues,
  onSubmit,
  children,
}: ModifierGroupFormProps) {
  const form = useForm<ModifierGroupFormValues>({
    resolver: zodResolver(modifierGroupFormSchema),
    defaultValues: {
      name: '',
      description: null,
      isRequired: false,
      minSelections: 0,
      maxSelections: 1,
      ...defaultValues,
    },
  });

  const maxSelections = form.watch('maxSelections');

  const [selectionMode, setSelectionMode] = React.useState<SelectionMode>(
    deriveMode(defaultValues?.maxSelections ?? 1)
  );

  function handleModeChange(mode: SelectionMode) {
    setSelectionMode(mode);
    if (mode === 'single') {
      form.setValue('minSelections', form.getValues('isRequired') ? 1 : 0);
      form.setValue('maxSelections', 1);
    } else {
      form.setValue('maxSelections', 3);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <TextField
            field={field}
            fieldState={fieldState}
            label="Group Name"
            placeholder="e.g. Size, Toppings, Milk"
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
            placeholder="Optional description for this group..."
            maxLength={1000}
          />
        )}
      />

      <Controller
        name="isRequired"
        control={form.control}
        render={({ field, fieldState }) => (
          <SwitchField
            field={{
              ...field,
              onChange: (checked: boolean) => {
                field.onChange(checked);
                if (checked && form.getValues('minSelections') === 0) {
                  form.setValue('minSelections', 1);
                }
                if (!checked && selectionMode === 'single') {
                  form.setValue('minSelections', 0);
                }
              },
            }}
            fieldState={fieldState}
            label="Required"
            description="Customer must select before ordering"
          />
        )}
      />

      <SelectionTypeCards value={selectionMode} onChange={handleModeChange} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="minSelections"
          control={form.control}
          render={({ field, fieldState }) => (
            <NumberField
              field={field}
              fieldState={fieldState}
              label="Min Selections"
              min={0}
            />
          )}
        />

        <Controller
          name="maxSelections"
          control={form.control}
          render={({ field, fieldState }) => (
            <NumberField
              field={field}
              fieldState={fieldState}
              label="Max Selections"
              placeholder="Unlimited"
              description="Leave empty for unlimited"
              min={1}
            />
          )}
        />
      </div>

      {children}
    </form>
  );
}
