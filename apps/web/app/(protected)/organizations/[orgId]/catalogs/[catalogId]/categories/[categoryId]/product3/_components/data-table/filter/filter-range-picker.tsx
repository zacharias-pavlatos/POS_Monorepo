'use client';

import * as React from 'react';

import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Slider } from '@repo/ui/components/slider';

import type { RangeFilterFieldDef } from './types';

interface FilterRangePickerProps<TData> {
  field: RangeFilterFieldDef<TData>;
  data: TData[];
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function safeNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildHistogram(values: number[], min: number, max: number, bucketCount = 20) {
  if (!values.length) {
    return Array.from({ length: bucketCount }, () => ({ count: 0, pct: 0 }));
  }

  if (min >= max) {
    return Array.from({ length: bucketCount }, (_, index) => ({
      count: index === 0 ? values.length : 0,
      pct: index === 0 ? 1 : 0,
    }));
  }

  const bucketSize = (max - min) / bucketCount;
  const buckets = Array(bucketCount).fill(0) as number[];

  for (const value of values) {
    const clamped = clamp(value, min, max);
    const index = Math.min(Math.floor((clamped - min) / bucketSize), bucketCount - 1);

    buckets[index] = (buckets[index] ?? 0) + 1;
  }

  const maxCount = Math.max(...buckets, 1);

  return buckets.map(count => ({
    count,
    pct: count / maxCount,
  }));
}

export function FilterRangePicker<TData>({
  field,
  data,
  value,
  onChange,
  formatValue = v => v.toFixed(2),
}: FilterRangePickerProps<TData>) {
  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const step = field.step ?? 1;

  const [lo, hi] = value;

  const allValues = React.useMemo(
    () =>
      data
        .map(item => field.getValue(item))
        .filter((v): v is number => Number.isFinite(v)),
    [data, field]
  );

  const histogram = React.useMemo(
    () => buildHistogram(allValues, min, max, 20),
    [allValues, min, max]
  );

  const selectedCount = React.useMemo(
    () => allValues.filter(v => v >= lo && v <= hi).length,
    [allValues, lo, hi]
  );

  const bucketWidth = histogram.length > 0 ? (max - min) / histogram.length : 0;

  function updateLo(nextLo: number) {
    onChange([clamp(nextLo, min, hi - step), hi]);
  }

  function updateHi(nextHi: number) {
    onChange([lo, clamp(nextHi, lo + step, max)]);
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex h-12 items-end gap-px">
        {histogram.map((bucket, index) => {
          const barStart = min + index * bucketWidth;
          const barEnd = barStart + bucketWidth;
          const inRange = barEnd > lo && barStart < hi;

          return (
            <div
              key={index}
              className={
                inRange
                  ? 'bg-primary flex-1 rounded-t-sm'
                  : 'bg-muted-foreground/20 flex-1 rounded-t-sm'
              }
              style={{
                height: `${Math.max(bucket.pct * 100, bucket.count > 0 ? 8 : 0)}%`,
                minHeight: bucket.count > 0 ? 2 : 0,
                opacity: inRange ? 1 : 0.5,
              }}
            />
          );
        })}
      </div>

      <Slider
        min={min}
        max={max}
        step={step}
        value={[lo, hi]}
        onValueChange={([nextLo, nextHi]) => {
          onChange([clamp(nextLo ?? min, min, max), clamp(nextHi ?? max, min, max)]);
        }}
      />

      <div className="flex items-center gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label className="text-muted-foreground text-[10px] tracking-wider uppercase">
            Min
          </Label>
          <Input
            type="number"
            inputMode="decimal"
            step={step}
            value={lo}
            onChange={e => updateLo(safeNumber(e.target.value, lo))}
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
            inputMode="decimal"
            step={step}
            value={hi}
            onChange={e => updateHi(safeNumber(e.target.value, hi))}
            className="h-8 font-mono text-xs"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-primary font-mono font-medium">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''}
        </span>

        <span className="text-muted-foreground font-mono">
          {formatValue(lo)} — {formatValue(hi)}
        </span>
      </div>
    </div>
  );
}
