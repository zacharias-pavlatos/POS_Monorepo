import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { toast } from '@repo/ui/components/sonner';
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetContent,
  SheetTrigger,
  SheetFooter,
} from '@repo/ui/components/sheet';
import { Button } from '@repo/ui/components/button';

import { rpcClient } from '@/lib/rpc-client';
import { ProductForm, type ProductFormValues } from './product-form';
import { DangerZone } from '../form-fields/danger-zone';

interface ProductFormSheetProps {
  product?: Product; // undefined = create, defined = edit
  children: React.ReactNode; // trigger element
}

export const ProductFormSheet = ({ product, children }: ProductFormSheetProps) => {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const isEditingMode = !!product;

  const { data: workstations = [] } = useQuery({
    queryKey: ['workstations'],
    queryFn: () => rpcClient.workstations.all(),
  });

  const upsertProductMutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      return isEditingMode
        ? rpcClient.products.update({ id: product.id, ...values })
        : rpcClient.products.create(values);
    },
    onSuccess: async () => {
      toast.success(isEditingMode ? 'Product updated' : 'Product created');
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => {
      toast.error(
        isEditingMode ? 'Failed to update product' : 'Failed to create product'
      );
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return rpcClient.products.delete({ id });
    },
    onSuccess: async () => {
      toast.success('Product deleted');
      setOpen(false);

      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => {
      toast.error('Failed to delete product');
    },
  });

  function handleSubmit(values: ProductFormValues) {
    upsertProductMutation.mutate(values);
  }
  function handleDelete() {
    if (!product) return;
    deleteProductMutation.mutate(product.id);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle>{isEditingMode ? 'Edit Product' : 'New Product'}</SheetTitle>
          <SheetDescription>
            {isEditingMode
              ? "Update this product's details."
              : 'Add a new product to the menu.'}
          </SheetDescription>
        </SheetHeader>

        <ProductForm
          // Forces a fresh useForm instance when switching between products or between edit/create
          key={product?.id ?? 'create'}
          defaultValues={product}
          workstations={workstations}
          onSubmit={handleSubmit}
        >
          {isEditingMode && (
            <DangerZone
              actionLabel="Delete Product"
              description="Permanently delete this product and all its data."
              confirmTitle="Delete Product?"
              confirmDescription="This will permanently remove this product, including its modifier groups and any category associations. This action cannot be undone."
              onConfirm={handleDelete}
              isLoading={deleteProductMutation.isPending}
            />
          )}

          <SheetFooter className="pb-4">
            {/* <SheetFooter className="bg-background sticky bottom-0 border-t pb-4"> */}
            <Button
              type="submit"
              disabled={upsertProductMutation.isPending}
              className="w-full"
            >
              {upsertProductMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {isEditingMode ? 'Save Changes' : 'Create Product'}
            </Button>
          </SheetFooter>
        </ProductForm>
      </SheetContent>
    </Sheet>
  );
};
