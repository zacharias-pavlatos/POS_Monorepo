/**
 * A multi-select component.
 *
 * Provides a list of selectable string options with custom formatting
 * capabilities. It tracks the number of currently selected items and
 * includes a "Clear" button to easily reset the selection state.
 * Selected options are visually indicated with a highlighted checkbox.
 */

'use client';

import * as React from 'react';
import { Check } from 'lucide-react';

// import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';

interface FilterValuePickerProps {
  value: string[];
  options: string[];
  formatOption?: (value: string) => string;
  onChange: (value: string[]) => void;
}

export function ValuePicker({
  formatOption,
  options,
  value,
  onChange,
}: FilterValuePickerProps) {
  // Callback to format the visible value
  const format = formatOption ?? ((v: string) => v);

  function toggle(option: string) {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option));
      return;
    }

    onChange([...value, option]);
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Selected indicator and clear */}
      {/* <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{value.length} selected</span>

        {value.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
            Clear
          </Button>
        ) : null}
      </div> */}

      {/* Options */}
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {options.map(option => {
          const active = value.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left transition-colors',
                // active ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                active ? '' : 'hover:bg-accent/50'
              )}
            >
              <span className="truncate">{format(option)}</span>

              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40'
                )}
              >
                {active ? <Check className="h-4 w-4" /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
