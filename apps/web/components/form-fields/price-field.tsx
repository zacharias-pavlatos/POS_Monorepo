/**
 * PriceField — cents-based price input with auto-formatting.
 *
 * User types raw digits, decimal is auto-placed.
 * Type 850 → displays 8.50, type 1 → displays 0.01.
 *
 * Value is always stored in cents (integer) matching the API schema.
 */

import { Input } from '@repo/ui/components/input';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui/components/field';

import type { FieldRenderProps, BaseFieldUIProps } from './types';

export type PriceFieldProps = FieldRenderProps &
  BaseFieldUIProps & {
    currencyIcon?: string;
  };

export function PriceField({
  field,
  fieldState,
  label,
  description,
  required,
  disabled,
  currencyIcon = '€',
}: PriceFieldProps) {
  const displayValue = field.value != null ? (field.value / 100).toFixed(2) : '0.00';

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    const cents = parseInt(digits, 10) || 0;
    field.onChange(cents);
  }

  return (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <div className="relative">
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
          {currencyIcon}
        </span>
        <Input
          {...field}
          id={field.name}
          type="text"
          inputMode="numeric"
          disabled={disabled ?? field.disabled}
          value={displayValue}
          onChange={handleChange}
          className="pl-8"
          aria-invalid={fieldState.invalid}
        />
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  );
}
