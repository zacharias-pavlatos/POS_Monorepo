'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/popover';
import { formatPrice } from '../utils/format-price';
import type { Product } from '../types';
import {
  type ActiveFilters,
  type FilterFieldDef,
  PRODUCT_FILTER_FIELDS,
} from './filter-fields';
import { FilterRangePicker } from './filter-range-picker';
import { FilterValuePicker } from './filter-value-picker';

interface FilterBuilderProps {
  data: Product[];
  filters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
}

export function FilterBuilder({ data, filters, onFiltersChange }: FilterBuilderProps) {
  const [fieldPickerOpen, setFieldPickerOpen] = React.useState(false);
  const [editingKey, setEditingKey] = React.useState<string | null>(null);
  const [editingTempRange, setEditingTempRange] = React.useState<[number, number] | null>(
    null
  );

  const activeKeys = Object.keys(filters);
  const availableFields = PRODUCT_FILTER_FIELDS.filter(
    f => !activeKeys.includes(f.key as string) && editingKey !== f.key
  );

  function addFilter(fieldKey: string) {
    setFieldPickerOpen(false);
    const field = PRODUCT_FILTER_FIELDS.find(f => f.key === fieldKey);
    if (!field) return;

    if (field.type === 'range') {
      setEditingTempRange([field.min ?? 0, field.max ?? 100]);
    }
    setEditingKey(fieldKey);
  }

  function removeFilter(key: string) {
    const next = { ...filters };
    delete next[key];
    onFiltersChange(next);
  }

  function commitRangeFilter() {
    if (!editingKey || !editingTempRange) return;
    const field = PRODUCT_FILTER_FIELDS.find(f => f.key === editingKey);
    if (!field) return;

    const isDefault =
      editingTempRange[0] === (field.min ?? 0) &&
      editingTempRange[1] === (field.max ?? 100);
    if (isDefault) {
      setEditingKey(null);
      setEditingTempRange(null);
      return;
    }
    onFiltersChange({ ...filters, [editingKey]: editingTempRange });
    setEditingKey(null);
    setEditingTempRange(null);
  }

  function commitValueFilter(selected: string[]) {
    if (!editingKey) return;
    if (selected.length === 0) {
      setEditingKey(null);
      return;
    }
    onFiltersChange({ ...filters, [editingKey]: selected });
    setEditingKey(null);
  }

  const editingField = editingKey
    ? (PRODUCT_FILTER_FIELDS.find(f => f.key === editingKey) ?? null)
    : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* ── Active filter chips ── */}
      {activeKeys.map(key => {
        const field = PRODUCT_FILTER_FIELDS.find(f => f.key === key);
        if (!field) return null;
        const val = filters[key];
        const fmt = field.formatOption ?? ((v: string) => v);
        const label =
          field.type === 'range'
            ? `${formatPrice((val as [number, number])[0] * 100)} – ${formatPrice((val as [number, number])[1] * 100)}`
            : (val as string[]).map(fmt).join(', ');

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
            <span className="max-w-[140px] truncate">{label}</span>
            <button
              onClick={() => removeFilter(key)}
              className="text-muted-foreground hover:text-destructive ml-0.5 rounded p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}

      {/* ── Editing filter (in-progress popover) ── */}
      {editingField && (
        <Popover
          open={true}
          onOpenChange={open => {
            if (!open) {
              setEditingKey(null);
              setEditingTempRange(null);
            }
          }}
        >
          <PopoverTrigger asChild>
            <Badge className="cursor-default rounded-md py-1 text-xs">
              {editingField.label}
            </Badge>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-2">
            {editingField.type === 'range' && editingTempRange ? (
              <FilterRangePicker
                field={editingField}
                data={data}
                value={editingTempRange}
                onChange={setEditingTempRange}
                onApply={commitRangeFilter}
              />
            ) : (
              <FilterValuePicker
                field={editingField}
                options={editingField.options?.(data) ?? []}
                initialSelected={[]}
                onApply={commitValueFilter}
              />
            )}
          </PopoverContent>
        </Popover>
      )}

      {/* ── "+ Filter" picker ── */}
      {availableFields.length > 0 && !editingKey && (
        <Popover open={fieldPickerOpen} onOpenChange={setFieldPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground h-7 gap-1 border-dashed text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Filter
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-44 p-1">
            {availableFields.map(f => (
              <button
                key={f.key as string}
                onClick={() => addFilter(f.key as string)}
                className="hover:bg-accent flex w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors"
              >
                {f.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}

      {/* ── Clear all ── */}
      {activeKeys.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 px-2 text-xs"
          onClick={() => onFiltersChange({})}
        >
          Clear all
          <X className="ml-1 h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
