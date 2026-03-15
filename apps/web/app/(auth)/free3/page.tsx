'use client';

import { ReorderableCards } from '@/components/card-grid-reorder-mode/reordable-card-grid-with-action-bar';
import { useBasicDataTable } from '@/components/data-table/hooks/use-basic-data-table';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';
import { useState } from 'react';
import { PRODUCTS } from './_components/data';
import { DataTableSearchBar } from '@/components/data-table/data-table-seartch-bar';
import { DataTableFilter } from '@/components/data-table/data-table-filter-builder';
import { DataTableColumnEditor } from '@/components/data-table/data-table-column-editor';
import { columns } from './_components/product-table-columns';
import { productFilterFields } from './_components/product-table-filter-fields';
import { Button } from '@repo/ui/components/button';
import { DataTableReorderable } from '@/components/data-table/data-table-dragable-with-action-bar';

export default function ProductsPage() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [reorderMode, setReorderMode] = useState(false);
  const [products, setProducts] = useState(PRODUCTS);

  const { table } = useBasicDataTable({ data: products, columns });
  const filteredProducts = table.getRowModel().rows.map(r => r.original);

  return (
    <div className="container mx-auto max-w-6xl space-y-4 py-8">
      {/* Toolbar — hidden during reorder */}
      {!reorderMode && (
        <div className="flex items-center gap-2">
          <DataTableSearchBar table={table} />
          <DataTableFilter table={table} data={products} fields={productFilterFields} />
          <DataTableColumnEditor table={table} />
        </div>
      )}

      {/* View toggle + reorder */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('grid')}
            // disabled={reorderMode}
          >
            Grid
          </Button>
          <Button
            variant={view === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('table')}
            // disabled={reorderMode}
          >
            Table
          </Button>
        </div>

        <Button
          variant={reorderMode ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setReorderMode(!reorderMode)}
        >
          {reorderMode ? 'Done' : 'Reorder'}
        </Button>
      </div>

      {/* Views — each self-contained */}
      {view === 'grid' ? (
        <ReorderableCards
          className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3"
          items={filteredProducts}
          reorderMode={reorderMode}
          onReorderModeChange={setReorderMode}
          onReorder={setProducts}
          onSave={async () => {
            // TODO: mutation
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));
          }}
          renderItem={(product, isReorderMode) =>
            isReorderMode ? (
              <ProductCard product={product} />
            ) : (
              <Link href={`/products/${product.id}`} className="block h-full">
                <ProductCard product={product} />
              </Link>
            )
          }
        />
      ) : (
        //TODO: Add disabled prop to the table that will hide the grap handle .
        // - Change the handle cell to a full column inside the tables column definition.

        <DataTableReorderable
          table={table}
          reorderMode={reorderMode}
          //TODO: Change the name
          onReorderModeChange={setReorderMode}
          onReorder={setProducts}
          onSave={async () => {
            // TODO: mutation
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));
          }}
        />
      )}
    </div>
  );
}
