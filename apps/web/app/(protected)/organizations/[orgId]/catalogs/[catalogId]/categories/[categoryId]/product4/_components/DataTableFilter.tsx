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
import { RangePicker } from '@/components/data-table/data-table-range-picker';
import { ValuePicker } from '@/components/data-table/data-table-value-picker';
import { FilterFieldDef } from './product-table-filter-fields';

interface FilterBuilderProps<TData> {
  table: Table<TData>;
  data: TData[];
  fields: FilterFieldDef<TData>[];
}

export function DataTableFilter<TData>({
  table,
  data,
  fields,
}: FilterBuilderProps<TData>) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ColumnFiltersState>([]);

  // Loads the tables applyed filters into draft state when the drawer opens,
  // It initiates the builder so users can  edit filters locally and apply or cancel safely.
  // We doit on the open so efresh draft from latest table state every time the drawer opens
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(table.getState().columnFilters);
    }
    setOpen(nextOpen);
  }

  function getDraftValue(key: string) {
    return draft.find(filter => filter.id === key)?.value;
  }

  function setDraftValue(key: string, value: unknown) {
    setDraft(prev => {
      const rest = prev.filter(filter => filter.id !== key);
      if (value == null || (Array.isArray(value) && value.length === 0)) {
        return rest;
      }
      return [...rest, { id: key, value }];
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
                  {field.type === 'range' ? (
                    <RangePicker
                      histogramValues={data.map(field.getValue)}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      selectedRange={
                        getDraftValue(field.key) as [number, number] | undefined
                      }
                      onChange={value => setDraftValue(field.key, value)}
                    />
                  ) : (
                    <ValuePicker
                      value={(getDraftValue(field.key) as string[] | undefined) ?? []}
                      options={field.options(data)}
                      formatOption={field.formatOption}
                      onChange={value => setDraftValue(field.key, value)}
                    />
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex items-center justify-between gap-4">
            {draft.length > 0 ? (
              <Button
                type="button"
                className="flex-1 p-5"
                variant="outline"
                onClick={() => setDraft([])}
              >
                Clear
              </Button>
            ) : null}

            <Button
              type="button"
              className="flex-1 p-5"
              onClick={() => {
                table.setColumnFilters(draft);
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
