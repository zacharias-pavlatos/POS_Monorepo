// products/page.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@repo/ui/components/button';

import { useBasicDataTable } from '@/components/data-table/hooks/use-basic-data-table';
import { ReorderableCardGrid } from '@/components/card-grid-reorder-mode/reordable-card-grid';
import { DraggableTable } from '@/components/data-table/data-table-dragable';
import { ReorderActionBar } from '@/components/reorder-action-bar';
import { DataTableSearchBar } from '@/components/data-table/data-table-seartch-bar';
import { DataTableFilter } from '@/components/data-table/data-table-filter-builder';
import { DataTableColumnEditor } from '@/components/data-table/data-table-column-editor';
import { ProductCard } from '@/components/product-card';
import { ProductFormSheet } from '@/components/forms/products/product-form-sheet';
import { useReorderableRollback } from '@/hooks/use-reorderable-rollback';
import { rpcClient } from '@/lib/rpc-client';

import { columns } from './_components/product-table-columns';
import { productFilterFields } from './_components/product-table-filter-fields';
import { cn } from '@repo/ui/lib/utils';

export default function ProductsPage() {
  const { categoryId } = useParams<{
    categoryId: string;
  }>();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const { data: serverProducts = [], isLoading } = useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      const result = await rpcClient.products.all();
      console.log('client received:', result.length, result);
      return result;
    },
  });

  const [localProducts, setLocalProducts] = useState<typeof serverProducts | null>(null);
  const products = localProducts ?? serverProducts;

  const { table } = useBasicDataTable({ data: products, columns });
  const filteredProducts = table.getRowModel().rows.map(r => r.original);

  const reorder = useReorderableRollback(filteredProducts, setLocalProducts);

  return (
    <div className="container mx-auto max-w-6xl space-y-4 py-8">
      {/* Toolbar — hidden during reorder */}
      <div className="flex items-center justify-end gap-2">
        <ProductFormSheet>
          <Button variant="default">
            <Plus className="size-4" />
            New Product
          </Button>
        </ProductFormSheet>
      </div>
      {!reorder.reorderMode && (
        <div className="flex items-center gap-2">
          <DataTableSearchBar table={table} />
          <DataTableFilter table={table} data={products} fields={productFilterFields} />
          <DataTableColumnEditor table={table} />
        </div>
      )}

      {/* View toggle + reorder button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('grid')}
          >
            Grid
          </Button>
          <Button
            variant={view === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('table')}
          >
            Table
          </Button>
        </div>

        <Button
          variant={reorder.reorderMode ? 'default' : 'ghost'}
          size="sm"
          onClick={() =>
            reorder.reorderMode ? reorder.cancel() : reorder.setReorderMode(true)
          }
          className={cn('flex items-center gap-2', reorder.reorderMode && 'invisible')}
        >
          Reorder
        </Button>
      </div>

      {/* Views */}
      {view === 'grid' ? (
        <ReorderableCardGrid
          className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3"
          items={filteredProducts}
          disabled={!reorder.reorderMode}
          onReorder={setLocalProducts}
          onDragStart={() => reorder.setIsDragging(true)}
          onDragEnd={() => reorder.setIsDragging(false)}
          renderItem={product =>
            reorder.reorderMode ? (
              <ProductCard product={product} />
            ) : (
              <Link href={`/products/${product.id}`} className="block h-full">
                <ProductCard product={product} />
              </Link>
            )
          }
        />
      ) : (
        <DraggableTable
          table={table}
          onReorder={setLocalProducts}
          onDragStart={() => reorder.setIsDragging(true)}
          onDragEnd={() => reorder.setIsDragging(false)}
          //TODO: Add disabled prop to the table that will hide the grap handle .
          // - Change the handle cell to a full column inside the tables column definition.
          // disabled={!reorder.reorderMode}
        />
      )}

      {/* Action bar */}
      {reorder.reorderMode && !reorder.isDragging && (
        <ReorderActionBar
          changeCount={reorder.changeCount}
          isPending={reorder.isPending}
          onCancel={reorder.cancel}
          onSave={() =>
            reorder.save(async () => {
              // TODO: your mutation
              await new Promise(resolve => setTimeout(resolve, 1000));
            })
          }
        />
      )}
    </div>
  );
}
