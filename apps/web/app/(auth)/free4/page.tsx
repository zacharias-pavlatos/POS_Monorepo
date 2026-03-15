// products/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

import { useBasicDataTable } from '@/components/data-table/hooks/use-basic-data-table';
import { ReorderableCardGrid } from '@/components/card-grid-reorder-mode/reordable-card-grid';
import { DraggableTable } from '@/components/data-table/data-table-dragable';
import { ReorderActionBar } from '@/components/reorder-action-bar';
import { DataTableSearchBar } from '@/components/data-table/data-table-seartch-bar';
import { DataTableFilter } from '@/components/data-table/data-table-filter-builder';
import { DataTableColumnEditor } from '@/components/data-table/data-table-column-editor';
import { ProductCard } from '@/components/product-card';
import { Button } from '@repo/ui/components/button';
import { columns } from './_components/product-table-columns';
import { productFilterFields } from './_components/product-table-filter-fields';
import { PRODUCTS } from './_components/data';
import { useReorderableRollback } from '@/hooks/use-reorderable-rollback';

export default function ProductsPage() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [products, setProducts] = useState(PRODUCTS);

  const { table } = useBasicDataTable({ data: products, columns });
  const filteredProducts = table.getRowModel().rows.map(r => r.original);

  const reorder = useReorderableRollback(filteredProducts, setProducts);

  return (
    <div className="container mx-auto max-w-6xl space-y-4 py-8">
      {/* Toolbar — hidden during reorder */}
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
        >
          {reorder.reorderMode ? 'Done' : 'Reorder'}
        </Button>
      </div>

      {/* Views */}
      {view === 'grid' ? (
        <ReorderableCardGrid
          className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3"
          items={filteredProducts}
          disabled={!reorder.reorderMode}
          onReorder={setProducts}
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
          onReorder={setProducts}
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
