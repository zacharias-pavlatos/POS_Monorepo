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

type SelectOption<TValue extends string | number = string> = {
  value: TValue;
  label: string;
};

export type SelectFieldProps<TValue extends string | number = string> =
  FieldRenderProps &
    BaseFieldUIProps & {
      placeholder?: string;
      options: SelectOption<TValue>[];
    };

export function SelectField<TValue extends string | number = string>({
  field,
  fieldState,
  label,
  placeholder = 'Select an option',
  description,
  required,
  disabled,
  options,
}: SelectFieldProps<TValue>) {
  return (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Select
        value={field.value != null ? String(field.value) : ''}
        onValueChange={val => {
          const match = options.find(o => String(o.value) === val);
          field.onChange(match?.value ?? val);
        }}
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
