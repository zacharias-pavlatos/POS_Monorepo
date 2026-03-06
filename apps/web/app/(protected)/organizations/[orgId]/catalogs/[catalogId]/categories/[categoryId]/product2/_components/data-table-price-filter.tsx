'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { type Column } from '@tanstack/react-table';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/popover';
import { Separator } from '@repo/ui/components/separator';
import { Slider } from '@repo/ui/components/slider';
import { formatPrice } from './utils/format-price';

interface DataTablePriceFilterProps<TData> {
  column: Column<TData, unknown>;
  title: string;
  min: number; // cents
  max: number; // cents
  step?: number; // cents
}

/**
 * Build histogram buckets from all pre-filtered row values.
 */
function buildHistogram(values: number[], min: number, max: number, bucketCount = 20) {
  const bucketSize = (max - min) / bucketCount;
  const buckets = Array(bucketCount).fill(0) as number[];
  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / bucketSize), bucketCount - 1);
    if (idx >= 0) buckets[idx]++;
  }
  const maxCount = Math.max(...buckets, 1);
  return buckets.map(count => ({
    count,
    pct: count / maxCount,
  }));
}

export function DataTablePriceFilter<TData>({
  column,
  title,
  min,
  max,
  step = 50, // 50 cents default
}: DataTablePriceFilterProps<TData>) {
  const filterValue = column.getFilterValue() as [number, number] | undefined;
  const [range, setRange] = React.useState<[number, number]>(filterValue ?? [min, max]);

  // Get all pre-filtered values for the histogram
  const allValues = React.useMemo(() => {
    return column.getFacetedRowModel().rows.map(row => row.getValue<number>(column.id));
  }, [column]);

  const histogram = React.useMemo(
    () => buildHistogram(allValues, min, max, 24),
    [allValues, min, max]
  );

  const isFiltered = filterValue != null;
  const selectedCount = allValues.filter(v => v >= range[0] && v <= range[1]).length;

  // Convert cents to slider-friendly values
  const sliderMin = min / 100;
  const sliderMax = max / 100;
  const sliderStep = step / 100;
  const sliderValue = [range[0] / 100, range[1] / 100];

  function handleSliderChange(value: number[]) {
    const newRange: [number, number] = [
      Math.round(value[0] * 100),
      Math.round(value[1] * 100),
    ];
    setRange(newRange);
  }

  function apply() {
    if (range[0] === min && range[1] === max) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue(range);
    }
  }

  function clear() {
    setRange([min, max]);
    column.setFilterValue(undefined);
  }

  // Determine which histogram bars are inside the selected range
  const bucketWidth = (max - min) / histogram.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <Plus className="mr-1 h-3.5 w-3.5" />
          {title}
          {isFiltered && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {formatPrice(filterValue[0])} – {formatPrice(filterValue[1])}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4" align="start">
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            {title}
          </p>

          {/* Histogram */}
          <div className="flex h-12 items-end gap-px">
            {histogram.map((bucket, i) => {
              const barStart = min + i * bucketWidth;
              const barEnd = barStart + bucketWidth;
              const inRange = barEnd > range[0] && barStart < range[1];
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm transition-colors ${
                    inRange ? 'bg-primary' : 'bg-muted-foreground/20'
                  }`}
                  style={{
                    height: `${Math.max(bucket.pct * 100, bucket.count > 0 ? 8 : 0)}%`,
                    minHeight: bucket.count > 0 ? 2 : 0,
                    opacity: inRange ? 1 : 0.5,
                  }}
                />
              );
            })}
          </div>

          {/* Slider */}
          <Slider
            min={sliderMin}
            max={sliderMax}
            step={sliderStep}
            value={sliderValue}
            onValueChange={handleSliderChange}
            className="py-1"
          />

          {/* Number inputs */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label className="text-muted-foreground text-[10px] tracking-wider uppercase">
                Min
              </Label>
              <Input
                type="number"
                value={(range[0] / 100).toFixed(2)}
                step={sliderStep}
                onChange={e => {
                  const v = Math.round(parseFloat(e.target.value) * 100);
                  setRange([Math.max(min, Math.min(v, range[1] - step)), range[1]]);
                }}
                className="h-8 font-mono text-xs"
              />
            </div>
            <span className="text-muted-foreground mt-4">–</span>
            <div className="flex flex-1 flex-col gap-1">
              <Label className="text-muted-foreground text-[10px] tracking-wider uppercase">
                Max
              </Label>
              <Input
                type="number"
                value={(range[1] / 100).toFixed(2)}
                step={sliderStep}
                onChange={e => {
                  const v = Math.round(parseFloat(e.target.value) * 100);
                  setRange([range[0], Math.min(max, Math.max(v, range[0] + step))]);
                }}
                className="h-8 font-mono text-xs"
              />
            </div>
          </div>

          {/* Info + actions */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-primary font-mono font-medium">
              {selectedCount} product{selectedCount !== 1 ? 's' : ''}
            </span>
            <span className="text-muted-foreground font-mono">
              {formatPrice(range[0])} — {formatPrice(range[1])}
            </span>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={clear}>
              Clear
            </Button>
            <Button size="sm" className="flex-1" onClick={apply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
