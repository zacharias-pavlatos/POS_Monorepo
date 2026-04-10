'use client';

import { cn } from '@repo/ui/lib/utils';
import { Check } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SelectionMode = 'single' | 'multiple';

interface SelectionTypeCardsProps {
  value: SelectionMode;
  onChange: (mode: SelectionMode) => void;
}

// ---------------------------------------------------------------------------
// Mini Preview Row
// ---------------------------------------------------------------------------

function MiniRow({
  type,
  filled,
  barWidth,
}: {
  type: 'radio' | 'checkbox';
  filled?: boolean;
  barWidth?: 'short' | 'full';
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'flex h-3 w-3 shrink-0 items-center justify-center border-[1.5px]',
          type === 'radio' ? 'rounded-full' : 'rounded-[3px]',
          filled ? 'border-primary bg-primary' : 'border-muted-foreground/30'
        )}
      >
        {filled && type === 'radio' && <span className="h-1 w-1 rounded-full bg-white" />}
        {filled && type === 'checkbox' && (
          <Check className="h-2 w-2 text-white" strokeWidth={3} />
        )}
      </span>
      <span
        className={cn(
          'bg-muted-foreground/20 h-1.5 rounded-full',
          barWidth === 'short' ? 'w-3/5' : 'w-full'
        )}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function SelectionCard({
  title,
  description,
  selected,
  onClick,
  children,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-lg border-[1.5px] p-3.5 text-left transition-all',
        //selected ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'
        selected ? 'border-primary' : 'border-border hover:border-border/80'
      )}
    >
      {/* Checkmark */}
      <span
        className={cn(
          'justify-content absolute top-2.5 right-2.5 flex h-[18px] w-[18px] items-center rounded-full border-[1.5px]',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
        )}
      >
        {selected && <Check className="mx-auto h-3 w-3 text-white" strokeWidth={3} />}
      </span>

      <div className={cn('text-sm font-semibold', selected && 'text-primary')}>
        {title}
      </div>
      <div className="text-muted-foreground mt-0.5 text-[11px]">{description}</div>
      <div className="mt-3 flex flex-col gap-1.5">{children}</div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SelectionTypeCards({ value, onChange }: SelectionTypeCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <SelectionCard
        title="Single"
        description="Pick one option"
        selected={value === 'single'}
        onClick={() => onChange('single')}
      >
        <MiniRow type="radio" filled barWidth="short" />
        <MiniRow type="radio" barWidth="full" />
        <MiniRow type="radio" barWidth="short" />
      </SelectionCard>

      <SelectionCard
        title="Multiple"
        description="Pick several options"
        selected={value === 'multiple'}
        onClick={() => onChange('multiple')}
      >
        <MiniRow type="checkbox" filled barWidth="full" />
        <MiniRow type="checkbox" filled barWidth="short" />
        <MiniRow type="checkbox" barWidth="full" />
      </SelectionCard>
    </div>
  );
}
