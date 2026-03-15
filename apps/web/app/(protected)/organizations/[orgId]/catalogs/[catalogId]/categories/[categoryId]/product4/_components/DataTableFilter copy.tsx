'use client';

import * as React from 'react';
import type { ColumnFiltersState, Table } from '@tanstack/react-table';
import { Button } from '@repo/ui/components/button';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/components/drawer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/ui/components/accordion';

type FilterField<TData> =
  | {
      key: string;
      label: string;
      type: 'multi_value';
      options: (data: TData[]) => string[];
      formatOption?: (value: string) => string;
    }
  | {
      key: string;
      label: string;
      type: 'range';
      min: number;
      max: number;
      step?: number;
    };

interface FilterBuilderProps<TData> {
  table: Table<TData>;
  data: TData[];
  fields: FilterField<TData>[];
}

export type DraftFilters = Record<string, string[] | [number, number]>;

export function DataTableFilter<TData>({
  table,
  data,
  fields,
}: FilterBuilderProps<TData>) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftFilters>({});

  // Load the currently applied table filters into local draft state when the drawer opens.
  // This initializes the builder with the latest values so users can edit filters
  // locally and then apply or cancel safely.
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(normalizeColumnFilters(table.getState().columnFilters));
    }

    setOpen(nextOpen);
  }

  function setDraftValue(key: string, value: string[] | [number, number] | undefined) {
    setDraft(prev => {
      const next = { ...prev };

      if (value == null || (Array.isArray(value) && value.length === 0)) {
        delete next[key];
        return next;
      }

      next[key] = value;
      return next;
    });
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          Filters
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85svh]">
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4">
          <Accordion
            type="multiple"
            // All accordion are open by default
            defaultValue={fields.map(field => field.key)}
            className="w-full"
          >
            {fields.map(field => (
              <AccordionItem key={field.key} value={field.key}>
                <AccordionTrigger>{field.label}</AccordionTrigger>

                <AccordionContent>
                  {field.type === 'multi_value' ? (
                    <MultiFilter
                      options={field.options(data)}
                      value={(draft[field.key] as string[] | undefined) ?? []}
                      formatOption={field.formatOption}
                      onChange={value => setDraftValue(field.key, value)}
                    />
                  ) : (
                    <RangeFilter
                      min={field.min}
                      max={field.max}
                      step={field.step ?? 1}
                      value={
                        (draft[field.key] as [number, number] | undefined) ?? [
                          field.min ?? 0,
                          field.max ?? 100,
                        ]
                      }
                      onChange={value => setDraftValue(field.key, value)}
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              className="flex-1"
              variant="outline"
              onClick={() => setDraft({})}
            >
              Clear
            </Button>

            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                table.setColumnFilters(deNormalizeColumnFilters(draft));
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * Converts TanStack Table filters into the shape used by the filter builder.
 * We need this conversion so the UI can read filters by key,
 * for example: `filters.stock` or `filters.price`.
 */
function normalizeColumnFilters(columnFilters: ColumnFiltersState): DraftFilters {
  return Object.fromEntries(
    columnFilters.map(filter => [filter.id, filter.value])
  ) as DraftFilters;
}

/**
 * Converts the filter builder state back into the format TanStack expects.
 * We need this conversion when applying filters with
 * `table.setColumnFilters(...)`.
 */
function deNormalizeColumnFilters(filters: DraftFilters): ColumnFiltersState {
  return Object.entries(filters).map(([id, value]) => ({
    id,
    value,
  }));
}

function MultiFilter({
  options,
  value,
  onChange,
  formatOption,
}: {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  formatOption?: (value: string) => string;
}) {
  const format = formatOption ?? ((v: string) => v);

  function toggle(option: string) {
    onChange(
      value.includes(option) ? value.filter(v => v !== option) : [...value, option]
    );
  }

  return (
    <div className="space-y-1">
      {options.map(option => (
        <button
          key={option}
          type="button"
          onClick={() => toggle(option)}
          className="block w-full rounded border px-3 py-2 text-left text-sm"
        >
          {value.includes(option) ? '✓ ' : ''}
          {format(option)}
        </button>
      ))}
    </div>
  );
}

function RangeFilter({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={e => onChange([Number(e.target.value), value[1]])}
        className="w-full rounded border px-2 py-1"
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value[1]}
        onChange={e => onChange([value[0], Number(e.target.value)])}
        className="w-full rounded border px-2 py-1"
      />
    </div>
  );
}
