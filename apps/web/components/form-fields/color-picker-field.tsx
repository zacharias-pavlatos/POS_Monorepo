import { cn } from '@repo/ui/lib/utils';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui/components/field';

import type { FieldRenderProps, BaseFieldUIProps } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ColorOption = {
  value: string;
  label: string;
};

const DEFAULT_COLORS: ColorOption[] = [
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
];

export type ColorPickerFieldProps = FieldRenderProps &
  BaseFieldUIProps & {
    /** Custom color options – defaults to a standard palette */
    colors?: ColorOption[];
    /** Allow deselecting – defaults to true */
    allowDeselect?: boolean;
  };

export function ColorPickerField({
  field,
  fieldState,
  label,
  description,
  required,
  colors = DEFAULT_COLORS,
  allowDeselect = true,
}: ColorPickerFieldProps) {
  return (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {colors.map(color => {
          const isSelected = field.value === color.value;
          return (
            <button
              key={color.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={color.label}
              onClick={() =>
                field.onChange(isSelected && allowDeselect ? null : color.value)
              }
              className={cn(
                'size-8 rounded-full transition-all',
                isSelected
                  ? 'ring-primary ring-offset-background ring-2 ring-offset-2'
                  : 'hover:scale-110'
              )}
              style={{ backgroundColor: color.value }}
            />
          );
        })}
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  );
}
