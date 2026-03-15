'use client';

import * as React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';

import { FilterDrawer } from './filter-drawer';

import type { ActiveFilters, FilterFieldDef } from './types';

interface FilterBuilderProps<TData> {
  data: TData[];
  fields: FilterFieldDef<TData>[];
  filters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  formatRangeValue?: (value: number) => string;
}

export function FilterBuilder<TData>({
  data,
  fields,
  filters,
  onFiltersChange,
  formatRangeValue = v => v.toFixed(2),
}: FilterBuilderProps<TData>) {
  const [open, setOpen] = React.useState(false);

  const activeKeys = Object.keys(filters);

  function removeFilter(key: string) {
    const next = { ...filters };
    delete next[key];
    onFiltersChange(next);
  }

  function getChipLabel(
    field: FilterFieldDef<TData>,
    value: string[] | [number, number]
  ) {
    if (field.type === 'range') {
      const [min, max] = value as [number, number];
      const formatter = field.formatValue ?? formatRangeValue;
      return `${formatter(min)} – ${formatter(max)}`;
    }

    const formatter = field.formatOption ?? ((v: string) => v);
    return (value as string[]).map(formatter).join(', ');
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* The Chips when there is a selected filter outside of the drawer at the searchbar  */}
      {activeKeys.map(key => {
        // Find from inside the filterFields array tha we provided. If the key matched the current key (active filter)
        const field = fields.find(f => f.key === key);
        if (!field) return null;

        // the value of the filter
        const value = filters[key];
        const label = getChipLabel(field, value);

        return (
          <Badge
            key={key}
            variant="secondary"
            className="gap-1.5 rounded-md py-1 pr-1 pl-2.5 text-xs font-normal"
          >
            <span className="text-primary font-semibold tracking-wide uppercase">
              {field.label}
            </span>

            <span className="text-muted-foreground">is</span>

            <span className="max-w-[160px] truncate">{label}</span>

            <button
              type="button"
              onClick={() => removeFilter(key)}
              className="text-muted-foreground hover:text-destructive ml-0.5 rounded p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}

      {activeKeys.length > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 px-2 text-xs"
          //clears the filter
          onClick={() => onFiltersChange({})}
        >
          Clear all
          <X className="ml-1 h-3 w-3" />
        </Button>
      ) : null}

      {/* The Drawer */}
      <FilterDrawer
        open={open}
        onOpenChange={setOpen}
        data={data}
        fields={fields}
        filters={filters}
        onApply={onFiltersChange}
        formatRangeValue={formatRangeValue}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground h-7 gap-1 border-dashed text-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeKeys.length > 0 ? ` (${activeKeys.length})` : ''}
          </Button>
        }
      />
    </div>
  );
}
