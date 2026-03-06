'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import type { FilterFieldDef } from './types';

interface FilterValuePickerProps<TData> {
  field: FilterFieldDef<TData>;
  options: string[];
  initialSelected: string[];
  onApply: (selected: string[]) => void;
}

export function FilterValuePicker<TData>({
  field,
  options,
  initialSelected,
  onApply,
}: FilterValuePickerProps<TData>) {
  const [selected, setSelected] = React.useState<string[]>(initialSelected);
  const fmt = field.formatOption ?? ((v: string) => v);

  function toggle(opt: string) {
    setSelected(prev =>
      prev.includes(opt) ? prev.filter(v => v !== opt) : [...prev, opt]
    );
  }

  return (
    <div className="flex max-h-[280px] flex-col">
      <div className="flex-1 overflow-y-auto py-1">
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <div
              key={opt}
              role="button"
              onClick={e => {
                e.stopPropagation();
                toggle(opt);
              }}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors select-none',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50'
              )}
            >
              <span
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40'
                )}
              >
                {active && <Check className="h-3 w-3" />}
              </span>
              {fmt(opt)}
            </div>
          );
        })}
      </div>
      <div className="border-t pt-1.5">
        <Button
          size="sm"
          className="w-full"
          onClick={e => {
            e.stopPropagation();
            onApply(selected);
          }}
        >
          Apply{selected.length > 0 ? ` (${selected.length})` : ''}
        </Button>
      </div>
    </div>
  );
}
