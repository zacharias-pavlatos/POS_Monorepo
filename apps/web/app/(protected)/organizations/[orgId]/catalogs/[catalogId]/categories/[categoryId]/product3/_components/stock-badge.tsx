import { Badge } from '@repo/ui/components/badge';
import type { Product } from './types';

const STOCK_CONFIG = {
  in_stock: { label: 'In Stock', variant: 'default' as const },
  low_stock: { label: 'Low Stock', variant: 'secondary' as const },
  out_of_stock: { label: 'Out of Stock', variant: 'destructive' as const },
};

export function StockBadge({ stock }: { stock: Product['stock'] }) {
  const config = STOCK_CONFIG[stock];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
const STOCK_MAP = {
  in_stock: { label: 'In Stock', dot: '#10b981', pulse: false },
  low_stock: { label: 'Low Stock', dot: '#f59e0b', pulse: true },
  out_of_stock: { label: 'Out of Stock', dot: '#ef4444', pulse: true },
} as const;

export function StockBadgeDot({ stock }: { stock: Product['stock'] }) {
  const s = STOCK_MAP[stock];

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-gray-900">
      <span className="relative inline-flex h-2.5 w-2.5 shrink-0 items-center justify-center">
        {s.pulse && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: s.dot }}
          />
        )}
        <span
          className="relative inline-flex h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: s.dot }}
        />
      </span>
      {s.label}
    </span>
  );
}
