'use client';

import * as React from 'react';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Slider } from '@repo/ui/components/slider';
import type { FilterFieldDef } from './types';

interface FilterRangePickerProps<TData> {
  field: FilterFieldDef<TData>;
  data: TData[];
  value: [number, number];
  onChange: (value: [number, number]) => void;
  onApply: () => void;
  /** Format a number for display (e.g. cents → "€12.90"). Defaults to 2 decimal places. */
  formatValue?: (value: number) => string;
}

function buildHistogram(values: number[], min: number, max: number, bucketCount = 20) {
  const bucketSize = (max - min) / bucketCount;
  const buckets = Array(bucketCount).fill(0) as number[];
  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / bucketSize), bucketCount - 1);
    if (idx >= 0 && idx < bucketCount) {
      buckets[idx] = (buckets[idx] ?? 0) + 1;
    }
  }
  const maxCount = Math.max(...buckets, 1);
  return buckets.map(count => ({ count, pct: count / maxCount }));
}

export function FilterRangePicker<TData>({
  field,
  data,
  value,
  onChange,
  onApply,
  formatValue = v => v.toFixed(2),
}: FilterRangePickerProps<TData>) {
  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const step = field.step ?? 0.5;
  const [lo, hi] = value;
  const getValue = field.getValue ?? (() => 0);

  const allValues = React.useMemo(
    () => data.map(item => getValue(item)),
    [data, getValue]
  );

  const histogram = React.useMemo(
    () => buildHistogram(allValues, min, max, 20),
    [allValues, min, max]
  );

  const selectedCount = React.useMemo(
    () => allValues.filter(v => v >= lo && v <= hi).length,
    [allValues, lo, hi]
  );

  const bucketWidth = (max - min) / histogram.length;

  return (
    <div className="flex min-w-[260px] flex-col gap-3 p-1">
      {/* Histogram */}
      <div className="flex h-12 items-end gap-px">
        {histogram.map((bucket, i) => {
          const barStart = min + i * bucketWidth;
          const barEnd = barStart + bucketWidth;
          const inRange = barEnd > lo && barStart < hi;
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
        min={min}
        max={max}
        step={step}
        value={[lo, hi]}
        onValueChange={([newLo, newHi]) => onChange([newLo, newHi] as [number, number])}
      />

      {/* Number inputs */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label className="text-muted-foreground text-[10px] tracking-wider uppercase">
            Min
          </Label>
          <Input
            type="number"
            value={lo.toFixed(2)}
            step={step}
            onChange={e => {
              const v = Math.max(min, Math.min(parseFloat(e.target.value), hi - step));
              onChange([v, hi]);
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
            value={hi.toFixed(2)}
            step={step}
            onChange={e => {
              const v = Math.min(max, Math.max(parseFloat(e.target.value), lo + step));
              onChange([lo, v]);
            }}
            className="h-8 font-mono text-xs"
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-primary font-mono font-medium">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''}
        </span>
        <span className="text-muted-foreground font-mono">
          {formatValue(lo)} — {formatValue(hi)}
        </span>
      </div>

      <Button size="sm" onClick={onApply}>
        Apply
      </Button>
    </div>
  );
}
