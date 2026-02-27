import { Switch } from '@repo/ui/components/switch';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@repo/ui/components/field';

import type { FieldRenderProps, BaseFieldUIProps } from './types';

export function SwitchField({
  field,
  fieldState: _fieldState,
  label,
  description,
  disabled,
}: FieldRenderProps & BaseFieldUIProps) {
  return (
    <Field orientation="horizontal" className="border-border rounded-lg border p-4">
      <FieldContent>
        <FieldLabel htmlFor={field.name} className="text-base">
          {label}
        </FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FieldContent>
      <Switch
        id={field.name}
        checked={field.value}
        onCheckedChange={field.onChange}
        disabled={disabled}
        aria-label={label}
      />
    </Field>
  );
}
