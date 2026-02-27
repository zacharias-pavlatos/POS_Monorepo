import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@repo/ui/lib/utils';
import { Button } from '@repo/ui/components/button';
import { Calendar } from '@repo/ui/components/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/popover';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui/components/field';

import type { FieldRenderProps, BaseFieldUIProps } from './types';

export type DatePickerFieldProps = FieldRenderProps &
  BaseFieldUIProps & {
    placeholder?: string;
    /** Callback passed to Calendar's `disabled` prop to disable specific dates */
    disabledDates?: (date: Date) => boolean;
  };

export function DatePickerField({
  field,
  fieldState,
  label,
  placeholder = 'Pick a date',
  description,
  required,
  disabled,
  disabledDates,
}: DatePickerFieldProps) {
  return (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={field.name}
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !field.value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="size-4" />
            {field.value ? format(field.value, 'PPP') : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value ?? undefined}
            onSelect={field.onChange}
            disabled={disabledDates}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {description && <FieldDescription>{description}</FieldDescription>}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  );
}
