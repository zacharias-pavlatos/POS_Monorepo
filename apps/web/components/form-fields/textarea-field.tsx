import { Textarea } from '@repo/ui/components/textarea';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui/components/field';

import type { FieldRenderProps, BaseFieldUIProps } from './types';

export type TextareaFieldProps = FieldRenderProps &
  BaseFieldUIProps & {
    placeholder?: string;
    /** Show a live character counter – provide the max length */
    maxLength?: number;
    /** Minimum CSS height – defaults to "min-h-24" */
    minHeight?: string;
  };

export function TextareaField({
  field,
  fieldState,
  label,
  placeholder,
  description,
  required,
  disabled,
  maxLength,
  minHeight = 'min-h-24',
}: TextareaFieldProps) {
  const charCount = (field.value as string)?.length ?? 0;

  return (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Textarea
        {...field}
        id={field.name}
        placeholder={placeholder}
        disabled={disabled}
        className={`${minHeight} resize-none`}
        value={field.value ?? ''}
        aria-invalid={fieldState.invalid}
      />
      {(description || maxLength) && (
        <FieldDescription>
          {description}
          {maxLength && (
            <>
              {description && ' · '}
              {charCount.toLocaleString()}/{maxLength.toLocaleString()} characters
            </>
          )}
        </FieldDescription>
      )}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  );
}
