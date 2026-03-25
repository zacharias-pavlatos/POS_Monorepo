import type { SelectProductType as Product } from '@repo/orpc/contracts';

export function ProductCard({
  product,
  ref,
  ...props
}: { product: Product } & React.ComponentPropsWithoutRef<'div'> & {
    ref?: React.Ref<HTMLDivElement>;
  }) {
  return (
    <div
      ref={ref}
      {...props}
      className="group bg-card hover:border-border/80 flex cursor-pointer flex-col gap-2 rounded-lg border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
    >
      <div className="bg-muted flex h-16 items-center justify-center rounded-md text-3xl">
        {product.image}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <span className="truncate text-sm font-semibold">{product.name}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold">{product.basePrice}</span>
      </div>
    </div>
  );
}
