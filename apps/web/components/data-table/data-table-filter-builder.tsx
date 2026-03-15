/**
 * A drawer-based filter component for the data table.
 *
 * It dynamically renders filter inputs (such as range sliders or value pickers)
 * based on the provided field definitions. It allows users to manipulate a local
 * "draft" state of filters before applying them to the actual table state.
 */

'use client';

import * as React from 'react';
import type { ColumnFiltersState, Table } from '@tanstack/react-table';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/ui/components/accordion';
import { RangePicker } from '@/components/data-table/data-table-range-picker';
import { ValuePicker } from '@/components/data-table/data-table-value-picker';
import { FilterFieldDef } from './types';

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
        <Button variant="outline" size="sm" className="gap-2">
          Filters
          {/* Visual indication of active filters at the triger btn */}
          {table.getState().columnFilters.length > 0 ? (
            <span className="bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-sm font-mono text-xs">
              {table.getState().columnFilters.length}
            </span>
          ) : null}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85svh]">
        <DrawerHeader className="border-b">
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>
            Refine your data by selecting the appropriate filters below.
          </DrawerDescription>
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

//TODO:
//  Make chips based on the active filters. Maybe a seporate component
//  so it can be use outside the drawer

// {/* ── Active filter chips ── */}
//     {activeKeys.map(key => {
//       const field = fields.find(f => f.key === key);
//       if (!field) return null;
//       const val = filters[key];
//       const fmt = field.formatOption ?? ((v: string) => v);
//       const label =
//         field.type === 'range'
//           ? `${formatRangeValue((val as [number, number])[0])} – ${formatRangeValue((val as [number, number])[1])}`
//           : (val as string[]).map(fmt).join(', ');

//       return (
//         <Badge
//           key={key}
//           variant="secondary"
//           className="gap-1.5 rounded-md py-1 pr-1 pl-2.5 text-xs font-normal"
//         >
//           <span className="text-primary font-semibold tracking-wide uppercase">
//             {field.label}
//           </span>
//           <span className="text-muted-foreground">is</span>
//           <span className="max-w-[140px] truncate">{label}</span>
//           <button
//             onClick={() => removeFilter(key)}
//             className="text-muted-foreground hover:text-destructive ml-0.5 rounded p-0.5 transition-colors"
//           >
//             <X className="h-3 w-3" />
//           </button>
//         </Badge>
//       );
//     })}
