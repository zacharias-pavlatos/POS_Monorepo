/**
 * NumberField — number input with null-safe value handling.
 *
 * Bridges the gap between the data layer (which uses `null` for empty optional fields
 * and `number` for values) and the DOM (which works with strings).
 *
 * - Display: `null` → `''`, `number` → `string` (via `value ?? ''`)
 * - Storage: `''` → `null`, `string` → `Number()` (via `onChange`)
 *
 * This conversion happens here — the only layer that touches the DOM —
 * so forms and pages always work with `number | null` end-to-end, matching the API schema.
 */

import { Input } from '@repo/ui/components/input';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui/components/field';

import type { FieldRenderProps, BaseFieldUIProps } from './types';

export type NumberFieldProps = FieldRenderProps &
  BaseFieldUIProps & {
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
  };

export function NumberField({
  field,
  fieldState,
  label,
  placeholder,
  description,
  required,
  disabled,
  min,
  max,
  step,
}: NumberFieldProps) {
  return (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Input
        id={field.name}
        type="number"
        placeholder={placeholder}
        disabled={disabled ?? field.disabled}
        min={min}
        max={max}
        step={step}
        value={field.value ?? ''}
        onChange={e => {
          const raw = e.target.value;
          field.onChange(raw === '' ? null : Number(raw));
        }}
        onBlur={field.onBlur}
        ref={field.ref}
        name={field.name}
        aria-invalid={fieldState.invalid}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  );
}
