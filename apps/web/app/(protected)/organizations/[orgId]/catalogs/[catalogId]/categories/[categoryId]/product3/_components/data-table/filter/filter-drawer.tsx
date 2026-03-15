'use client';

import * as React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/ui/components/accordion';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/components/drawer';

import { FilterRangePicker } from './filter-range-picker';
import { FilterValuePicker } from './filter-value-picker';

import type { ActiveFilters, FilterFieldDef } from './types';

interface FilterDrawerProps<TData> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  data: TData[];
  fields: FilterFieldDef<TData>[];
  filters: ActiveFilters;
  onApply: (filters: ActiveFilters) => void;
  formatRangeValue?: (value: number) => string;
}

export function FilterDrawer<TData>({
  open,
  onOpenChange,
  trigger,
  data,
  fields,
  filters,
  onApply,
  formatRangeValue = v => v.toFixed(2),
}: FilterDrawerProps<TData>) {
  // The filters before got apllied
  const [draftFilters, setDraftFilters] = React.useState<ActiveFilters>(filters);

  React.useEffect(() => {
    if (open) {
      setDraftFilters(filters);
    }
  }, [open, filters]);

  function setValueFilter(key: string, value: string[]) {
    setDraftFilters(prev => {
      const next = { ...prev };

      if (value.length === 0) {
        delete next[key];
      } else {
        next[key] = value;
      }

      return next;
    });
  }

  function setRangeFilter(field: FilterFieldDef<TData>, value: [number, number]) {
    if (field.type !== 'range') return;

    setDraftFilters(prev => {
      const next = { ...prev };

      const min = field.min ?? 0;
      const max = field.max ?? 100;
      const isDefault = value[0] === min && value[1] === max;

      if (isDefault) {
        delete next[field.key];
      } else {
        next[field.key] = value;
      }

      return next;
    });
  }

  function clearAllDraft() {
    setDraftFilters({});
  }

  function getSummary(field: FilterFieldDef<TData>) {
    const currentValue = draftFilters[field.key];
    if (!currentValue) return null;

    if (field.type === 'range') {
      const [min, max] = currentValue as [number, number];
      const formatter = field.formatValue ?? formatRangeValue;
      return `${formatter(min)} – ${formatter(max)}`;
    }

    const formatter = field.formatOption ?? ((v: string) => v);
    return (currentValue as string[]).map(formatter).join(', ');
  }

  const activeCount = Object.keys(draftFilters).length;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>

      <DrawerContent className="max-h-[85svh]">
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>
            Refine the table results using one or more filters.
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-6">
          <Accordion
            type="multiple"
            className="w-full"
            defaultValue={fields.map(field => field.key)}
          >
            {fields.map(field => {
              const summary = getSummary(field);

              return (
                <AccordionItem key={field.key} value={field.key}>
                  <AccordionTrigger className="gap-3 py-3">
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
                      <span className="text-base font-bold">{field.label}</span>

                      {summary ? (
                        <Badge
                          variant="secondary"
                          className="max-w-[180px] truncate font-normal"
                        >
                          {summary}
                        </Badge>
                      ) : null}
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-1">
                    {field.type === 'range' ? (
                      <FilterRangePicker
                        field={field}
                        data={data}
                        value={
                          (draftFilters[field.key] as [number, number] | undefined) ?? [
                            field.min ?? 0,
                            field.max ?? 100,
                          ]
                        }
                        onChange={value => setRangeFilter(field, value)}
                        formatValue={field.formatValue ?? formatRangeValue}
                      />
                    ) : (
                      <FilterValuePicker
                        field={field}
                        options={field.options(data)}
                        value={(draftFilters[field.key] as string[] | undefined) ?? []}
                        onChange={value => setValueFilter(field.key, value)}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex items-center justify-between gap-2">
            <Button
              className="flex-1"
              type="button"
              variant="outline"
              onClick={clearAllDraft}
              disabled={activeCount === 0}
            >
              Clear all
            </Button>

            <Button
              className="flex-1"
              type="button"
              onClick={() => {
                onApply(draftFilters);
                onOpenChange(false);
              }}
            >
              Apply filters
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
