import { formatPrice } from '../utils/format-price';
import { StockBadge } from '../stock-badge';

import type { Product } from '../types';

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group bg-card hover:border-border/80 flex cursor-pointer flex-col gap-2 rounded-lg border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm">
      <div className="bg-muted flex h-16 items-center justify-center rounded-md text-3xl">
        {product.image}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <span className="truncate text-sm font-semibold">{product.name}</span>
        <div className="flex flex-wrap gap-1">
          {product.categories.map(c => (
            <span
              key={c}
              className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold">{formatPrice(product.price)}</span>
        <StockBadge stock={product.stock} />
      </div>
    </div>
  );
}
