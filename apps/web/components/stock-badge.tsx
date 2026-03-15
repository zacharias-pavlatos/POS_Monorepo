const STOCK = {
  in_stock: { label: 'In Stock', color: '#10b981', pulse: false },
  low_stock: { label: 'Low Stock', color: '#f59e0b', pulse: true },
  out_of_stock: { label: 'Out of Stock', color: '#ef4444', pulse: true },
} as const;

type Stock = keyof typeof STOCK;

export function StockBadge({ stock }: { stock: Stock }) {
  const { label, color, pulse } = STOCK[stock];

  return (
    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
      <span className="relative inline-flex h-2 w-2">
        {pulse && (
          <span
            className="absolute inset-0 animate-ping rounded-full opacity-75"
            style={{ backgroundColor: color }}
          />
        )}
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </span>
      {label}
    </span>
  );
}
