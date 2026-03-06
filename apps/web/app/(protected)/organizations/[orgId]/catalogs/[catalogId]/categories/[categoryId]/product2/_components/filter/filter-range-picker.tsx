'use client';

import * as React from 'react';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Slider } from '@repo/ui/components/slider';
import { formatPrice } from '../utils/format-price';
import type { Product } from '../types';
import type { FilterFieldDef } from './filter-fields';
import { PriceField } from '@/components/form-fields/price-field';

interface FilterRangePickerProps {
  field: FilterFieldDef;
  data: Product[];
  value: [number, number];
  onChange: (value: [number, number]) => void;
  onApply: () => void;
}

function buildHistogram(data: Product[], min: number, max: number, bucketCount = 20) {
  const bucketSize = (max - min) / bucketCount;
  const buckets = Array(bucketCount).fill(0) as number[];
  for (const p of data) {
    const euros = p.price / 100;
    const idx = Math.min(Math.floor((euros - min) / bucketSize), bucketCount - 1);
    buckets[idx] = (buckets[idx] ?? 0) + 1;
  }
  const maxCount = Math.max(...buckets, 1);
  return buckets.map(count => ({ count, pct: count / maxCount }));
}

export function FilterRangePicker({
  field,
  data,
  value,
  onChange,
  onApply,
}: FilterRangePickerProps) {
  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const step = field.step ?? 0.5;
  const [lo, hi] = value;

  const histogram = React.useMemo(
    () => buildHistogram(data, min, max, 20),
    [data, min, max]
  );

  const selectedCount = React.useMemo(
    () => data.filter(p => p.price / 100 >= lo && p.price / 100 <= hi).length,
    [data, lo, hi]
  );

  // Histogram bar range highlighting
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
          {selectedCount} product{selectedCount !== 1 ? 's' : ''}
        </span>
        <span className="text-muted-foreground font-mono">
          {formatPrice(lo * 100)} — {formatPrice(hi * 100)}
        </span>
      </div>

      <Button size="sm" onClick={onApply}>
        Apply
      </Button>
    </div>
  );
}
