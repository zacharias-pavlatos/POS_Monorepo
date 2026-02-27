import { cn } from '@repo/ui/lib/utils';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui/components/field';

import type { FieldRenderProps, BaseFieldUIProps } from './types';

type Day = {
  value: number;
  label: string;
};

//TODO: Make this with i18n locales
const DEFAULT_DAYS: Day[] = [
  { value: 0, label: 'M' },
  { value: 1, label: 'T' },
  { value: 2, label: 'W' },
  { value: 3, label: 'T' },
  { value: 4, label: 'F' },
  { value: 5, label: 'S' },
  { value: 6, label: 'S' },
];

const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export type WeekDaysFieldProps = FieldRenderProps &
  BaseFieldUIProps & {
    /** Custom day options – defaults to Mon–Sun */
    days?: Day[];
  };

export function WeekDaysField({
  field,
  fieldState,
  label,
  description,
  required,
  days = DEFAULT_DAYS,
}: WeekDaysFieldProps) {
  const selected: number[] = field.value ?? [];

  function toggleDay(day: number) {
    const next = selected.includes(day)
      ? selected.filter(d => d !== day)
      : [...selected, day];
    field.onChange(next);
  }

  return (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <div className="flex gap-2" role="group" aria-label={label}>
        {days.map(day => {
          const isSelected = selected.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              aria-label={DAY_NAMES[day.value] ?? day.label}
              onClick={() => toggleDay(day.value)}
              className={cn(
                'flex size-9 items-center justify-center rounded-full text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {day.label}
            </button>
          );
        })}
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  );
}
