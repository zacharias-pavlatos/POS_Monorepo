'use client';

import * as React from 'react';
import { Plus, Pencil } from 'lucide-react';
import { toast } from '@repo/ui/components/sonner';

import { Button } from '@repo/ui/components/button';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { rpcClient } from '@/lib/rpc-client';
import { ProductForm } from '@/components/forms/product-form-old';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

import type { ProductFormValues } from '@/components/forms/product-form-old';
import type { SelectProductType as Product } from '@repo/orpc/contracts';

export function ProductsPage() {
  const { categoryId } = useParams<{
    categoryId: string;
  }>();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product>();

  const queryClient = useQueryClient();

  // Fetch workstations (for the optional override select)
  const { data: workstations = [], isLoading: isLoadingWorkstations } = useQuery({
    queryKey: ['workstations'],
    queryFn: () => rpcClient.workstations.all(),
  });

  // Fetch products for this category
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', categoryId],
    queryFn: () => rpcClient.products.byCategory({ categoryId }),
  });

  // Upsert mutation
  const upsertProductMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      return editingProduct
        ? rpcClient.products.update({ id: editingProduct.id, ...values })
        : rpcClient.products.createWithCategories({
            ...values,
            categoryIds: [categoryId],
          });
    },
    onSuccess: async () => {
      toast.success(editingProduct ? 'Product updated' : 'Product created');
      setDialogOpen(false);
      setEditingProduct(undefined);
      await queryClient.invalidateQueries({ queryKey: ['products', categoryId] });
    },
    onError: () => {
      toast.error(
        editingProduct ? 'Failed to update product' : 'Failed to create product'
      );
    },
  });

  // Delete mutation
  const deleteProductMutation = useMutation({
    mutationFn: () => rpcClient.products.delete({ id: editingProduct!.id }),
    onSuccess: async () => {
      toast.success('Product deleted');
      setDialogOpen(false);
      setEditingProduct(undefined);
      await queryClient.invalidateQueries({ queryKey: ['products', categoryId] });
    },
    onError: () => {
      toast.error('Failed to delete product');
    },
  });

  function handleCreate() {
    setEditingProduct(undefined);
    setDialogOpen(true);
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setDialogOpen(true);
  }

  function handleSubmit(values: ProductFormValues) {
    upsertProductMutation.mutate(values);
  }

  function handleDelete() {
    deleteProductMutation.mutate();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>Products</h1>
        <Button onClick={handleCreate}>
          <Plus className="size-4" />
          Create Product
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {products.map(product => (
          <div key={product.id} className="flex items-center justify-between border p-2">
            <div>
              <span>{product.name}</span>
              <span className="text-muted-foreground ml-2 text-sm">
                €{(product.basePrice / 100).toFixed(2)}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
              <Pencil className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <ResponsiveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingProduct ? 'Edit Product' : 'Create Product'}
        description={editingProduct ? 'Update product details' : 'Create a new product'}
      >
        <ProductForm
          key={editingProduct?.id ?? 'create'}
          workstations={workstations}
          defaultValues={editingProduct}
          onSubmit={handleSubmit}
          isSubmitting={upsertProductMutation.isPending}
          submitLabel={editingProduct ? 'Save Changes' : 'Create Product'}
          onDelete={editingProduct ? handleDelete : undefined}
          isDeleting={deleteProductMutation.isPending}
        />
      </ResponsiveDialog>
    </div>
  );
}

export default ProductsPage;
