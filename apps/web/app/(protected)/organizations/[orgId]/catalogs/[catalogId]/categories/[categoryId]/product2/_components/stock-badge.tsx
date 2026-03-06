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
