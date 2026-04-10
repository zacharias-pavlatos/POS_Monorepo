import { Circle, CircleDot, Square, SquareCheck } from 'lucide-react';
import type { SelectModifierType as Modifier } from '@repo/orpc/contracts';
import { formatPrice } from '@/utils/format-price';

export function ModifierOptionRow({
  modifier,
  maxSelections,
  ...props
}: {
  modifier: Modifier;
  maxSelections: number | null;
} & React.ComponentPropsWithoutRef<'div'>) {
  const isSingleSelect = maxSelections === 1;

  return (
    <div
      {...props}
      className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 py-2 pr-4 pl-4 transition-colors"
    >
      {/* Selection indicator */}
      {isSingleSelect ? (
        modifier.isDefault ? (
          <CircleDot className="text-primary h-4 w-4 shrink-0" />
        ) : (
          <Circle className="text-muted-foreground h-4 w-4 shrink-0" />
        )
      ) : modifier.isDefault ? (
        <SquareCheck className="text-primary h-4 w-4 shrink-0" />
      ) : (
        <Square className="text-muted-foreground h-4 w-4 shrink-0" />
      )}

      <span className="flex-1 truncate text-sm">{modifier.name}</span>

      <div className="flex items-center gap-2">
        {modifier.isDefault && (
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            Default
          </span>
        )}
        {!modifier.isActive && (
          <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-medium">
            Inactive
          </span>
        )}
        <span className="text-muted-foreground font-mono text-xs">
          {formatPrice(modifier.basePrice)}
        </span>
      </div>
    </div>
  );
}
