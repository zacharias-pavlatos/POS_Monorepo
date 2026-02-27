import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui/components/field';

import type { FieldRenderProps, BaseFieldUIProps } from './types';

type SelectOption = {
  value: string;
  label: string;
};

export type SelectFieldProps = FieldRenderProps &
  BaseFieldUIProps & {
    placeholder?: string;
    options: SelectOption[];
  };

export function SelectField({
  field,
  fieldState,
  label,
  placeholder = 'Select an option',
  description,
  required,
  disabled,
  options,
}: SelectFieldProps) {
  return (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Select
        value={field.value ?? ''}
        onValueChange={field.onChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={field.name}
          ref={field.ref as any}
          onBlur={field.onBlur}
          aria-invalid={fieldState.invalid}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <FieldDescription>{description}</FieldDescription>}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  );
}
