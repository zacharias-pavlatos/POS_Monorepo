/**
 * TextField — text input with null-safe value handling.
 *
 * Bridges the gap between the data layer (which uses `null` for empty optional fields)
 * and the DOM (which needs `''` to keep inputs controlled).
 *
 * - Display: `null` → `''` (via `value ?? ''`)
 * - Storage: `''` → `null` (via `onChange`)
 *
 * This conversion happens here — the only layer that touches the DOM —
 * so forms and pages always work with `null` end-to-end, matching the API schema.
 */

import { Input } from '@repo/ui/components/input';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui/components/field';

import type { FieldRenderProps, BaseFieldUIProps } from './types';

export type TextFieldProps = FieldRenderProps &
  BaseFieldUIProps & {
    placeholder?: string;
    type?: React.ComponentProps<typeof Input>['type'];
  };

export function TextField({
  field,
  fieldState,
  label,
  placeholder,
  description,
  required,
  disabled,
  type = 'text',
}: TextFieldProps) {
  return (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Input
        {...field}
        id={field.name}
        type={type}
        placeholder={placeholder}
        disabled={disabled ?? field.disabled}
        value={field.value ?? ''}
        onChange={e => field.onChange(e.target.value || null)}
        aria-invalid={fieldState.invalid}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  );
}
