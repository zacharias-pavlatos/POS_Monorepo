/**
 *  Range filter component
 *
 * Displays an interactive double-slider and a histogram
 * that visualizes the distribution of numeric data. Users can filter by range
 * using the slider thumbs or by manually entering precise min/max values.
 *
 * It calculates and displays the real-time count of items within the selected
 * range, and automatically scales the histogram relative to the data limits.
 */

'use client';

import * as React from 'react';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Slider } from '@repo/ui/components/slider';

interface RangeFilterProps {
  min?: number;
  max?: number;
  step?: number;
  selectedRange?: [number, number];
  histogramValues: number[];
  onChange: (value: [number, number]) => void;
}

export function RangePicker({
  min,
  max,
  step = 1,
  histogramValues,
  selectedRange,
  onChange,
}: RangeFilterProps) {
  const derivedMin = histogramValues.length > 0 ? Math.min(...histogramValues) : 0;
  const derivedMax = histogramValues.length > 0 ? Math.max(...histogramValues) : 0;
  const resolvedMin = min ?? derivedMin;
  const resolvedMax = max ?? derivedMax;
  const [lo, hi] = selectedRange ?? [resolvedMin, resolvedMax];

  const histogram = React.useMemo(
    () => buildHistogram(histogramValues, resolvedMin, resolvedMax, 20),
    [histogramValues, resolvedMin, resolvedMax]
  );

  const selectedCount = React.useMemo(
    () => histogramValues.filter(v => v >= lo && v <= hi).length,
    [histogramValues, lo, hi]
  );

  const bucketWidth = (resolvedMax - resolvedMin) / histogram.length;

  return (
    <div className="flex min-w-[260px] flex-col gap-3 p-1">
      {/* Histogram */}

      <div className="flex h-12 items-end gap-px">
        {histogram.map((bucket, i) => {
          const barStart = resolvedMin + i * bucketWidth;
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
        min={resolvedMin}
        max={resolvedMax}
        step={step}
        value={[lo, hi]}
        onValueChange={([newLo, newHi]) => onChange([newLo, newHi] as [number, number])}
      />

      {/* TODO: Fix the inputs. the glitch */}
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
              const v = Math.max(
                resolvedMin,
                Math.min(parseFloat(e.target.value), hi - step)
              );
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
              const v = Math.min(
                resolvedMax,
                Math.max(parseFloat(e.target.value), lo + step)
              );
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
          {lo.toFixed(2)} — {hi.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/**
 * Build a histogram of the given values.
 * Returns an array of objects with the count and percentage of values in each bar.
 */
function buildHistogram(values: number[], min: number, max: number, barCount = 20) {
  const barSize = (max - min) / barCount;
  const bars = Array(barCount).fill(0) as number[];
  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / barSize), barCount - 1);
    if (idx >= 0 && idx < barCount) {
      bars[idx] = (bars[idx] ?? 0) + 1;
    }
  }
  const maxCount = Math.max(...bars, 1);
  return bars.map(count => ({ count, pct: count / maxCount }));
}
