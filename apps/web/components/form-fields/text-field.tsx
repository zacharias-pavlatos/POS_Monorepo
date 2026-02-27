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
        disabled={disabled}
        value={field.value ?? ''}
        aria-invalid={fieldState.invalid}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  );
}
