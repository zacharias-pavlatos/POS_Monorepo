// @repo/ui/components/floating-bar.tsx
'use client';

import * as React from 'react';
import { cn } from '@repo/ui/lib/utils';

// ─── Root ────────────────────────────────────────────────────
interface FloatingBarProps extends React.ComponentProps<'div'> {
  position?: 'bottom' | 'top';
}

function FloatingBar({
  className,
  position = 'bottom',
  children,
  ...props
}: FloatingBarProps) {
  return (
    <div
      className={cn(
        'animate-in fade-in fixed inset-x-0 z-50 flex justify-center duration-300',
        position === 'bottom' && 'slide-in-from-bottom-4 bottom-6',
        position === 'top' && 'slide-in-from-top-4 top-6',
        className
      )}
      {...props}
    >
      <div className="bg-foreground flex items-center gap-3.5 rounded-full py-2 pr-2 pl-5 shadow-lg">
        {children}
      </div>
    </div>
  );
}

// ─── Content (left side — info, badges, message) ─────────────
function FloatingBarContent({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      {children}
    </div>
  );
}

// ─── Badge (count pill) ──────────────────────────────────────
function FloatingBarBadge({
  className,
  children,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'bg-background text-foreground flex h-5.5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ─── Message ─────────────────────────────────────────────────
function FloatingBarMessage({
  className,
  children,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span className={cn('text-background/60 text-sm', className)} {...props}>
      {children}
    </span>
  );
}

// ─── Separator ───────────────────────────────────────────────
function FloatingBarSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('bg-background/20 h-5 w-px', className)} {...props} />;
}

// ─── Actions (right side — buttons) ──────────────────────────
function FloatingBarActions({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex items-center gap-1.5', className)} {...props}>
      {children}
    </div>
  );
}

export {
  FloatingBar,
  FloatingBarContent,
  FloatingBarBadge,
  FloatingBarMessage,
  FloatingBarSeparator,
  FloatingBarActions,
};
