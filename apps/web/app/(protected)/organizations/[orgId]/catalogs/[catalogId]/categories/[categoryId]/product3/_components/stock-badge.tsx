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
  in_stock: {
    label: 'In Stock',
    dot: '#10b981',
    text: '#065f46',
  },
  low_stock: {
    label: 'Low Stock',
    dot: '#f59e0b',
    text: '#92400e',
  },
  out_of_stock: {
    label: 'Out of Stock',
    dot: '#ef4444',
    text: '#991b1b',
  },
};

export function StockBadgeDot({ stock }: { stock: Product['stock'] }) {
  const s = STOCK_MAP[stock];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 500,
        color: s.text,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {s.label}
    </span>
  );
}
