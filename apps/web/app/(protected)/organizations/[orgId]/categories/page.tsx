'use client';

import * as React from 'react';
import { Plus, Pencil } from 'lucide-react';
import { toast } from '@repo/ui/components/sonner';

import { Button } from '@repo/ui/components/button';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { rpcClient } from '@/lib/rpc-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CategoryForm, type CategoryFormValues } from '@/components/forms/category-form';

import type { SelectCategoryType as Category } from '@repo/orpc/contracts';

export function CategoriesPage({ params }: { params: { catalogId: string } }) {
  const { catalogId } = params;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category>();

  const queryClient = useQueryClient();

  // Fetch workstations
  const { data: workstations = [] } = useQuery({
    queryKey: ['workstations'],
    queryFn: () => rpcClient.workstations.all(),
  });

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => rpcClient.categories.all(),
  });

  // One mutation that handles both create + update
  const upsertCategoryMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      return editingCategory
        ? rpcClient.categories.update({ id: editingCategory.id, ...values })
        : rpcClient.categories.create({ ...values, catalogId });
    },
    onSuccess: async () => {
      toast.success(editingCategory ? 'Category updated' : 'Category created');

      // Close dialog + reset edit state
      setDialogOpen(false);
      setEditingCategory(undefined);

      // Refetch catalogs list
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: () => {
      toast.error(
        editingCategory ? 'Failed to update category' : 'Failed to create category'
      );
    },
  });

  function handleCreate() {
    setEditingCategory(undefined);
    setDialogOpen(true);
  }

  function handleEdit(category: Category) {
    setEditingCategory(category);
    setDialogOpen(true);
  }

  function handleSubmit(values: CategoryFormValues) {
    upsertCategoryMutation.mutate(values);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>Categories</h1>
        <Button onClick={handleCreate}>
          <Plus className="size-4" />
          Create Category
        </Button>
      </div>

      {categories.map(category => (
        <div key={category.id} className="flex items-center justify-between">
          <span>{category.name}</span>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
            <Pencil className="size-4" />
          </Button>
        </div>
      ))}

      <ResponsiveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        description={
          editingCategory ? 'Update category details' : 'Create a new category'
        }
      >
        <CategoryForm
          key={editingCategory?.id ?? 'create'}
          workstations={workstations ?? []}
          defaultValues={
            // When editing, use existing category values.
            // When creating, pre-select the first workstation so the form starts valid. Is the one created at the init of the restaurant
            editingCategory ?? { workstationId: workstations[0]?.id }
          }
          onSubmit={handleSubmit}
          isSubmitting={upsertCategoryMutation.isPending}
          submitLabel={editingCategory ? 'Save Changes' : 'Create Category'}
        />
      </ResponsiveDialog>
    </div>
  );
}
export default CategoriesPage;
