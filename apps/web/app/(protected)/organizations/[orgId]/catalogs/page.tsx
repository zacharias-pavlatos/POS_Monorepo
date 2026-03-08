'use client';

import * as React from 'react';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { toast } from '@repo/ui/components/sonner';

import { Button } from '@repo/ui/components/button';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { rpcClient } from '@/lib/rpc-client';
import { CatalogForm } from '@/components/forms/catalog-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CatalogFormValues } from '@/components/forms/catalog-form';
import type { SelectCatalogType as Catalog } from '@repo/orpc/contracts';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function CatalogsPage() {
  const pathname = usePathname();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCatalog, setEditingCatalog] = React.useState<Catalog>();

  const queryClient = useQueryClient();

  // Fetch catalogs
  const { data: catalogs = [], isLoading } = useQuery({
    queryKey: ['catalogs'],
    queryFn: () => rpcClient.catalogs.all(),
  });

  // One mutation that handles both create + update
  const upsertCatalogMutation = useMutation({
    mutationFn: async (values: CatalogFormValues) => {
      return editingCatalog
        ? rpcClient.catalogs.update({ id: editingCatalog.id, ...values })
        : rpcClient.catalogs.create(values);
    },
    onSuccess: async () => {
      toast.success(editingCatalog ? 'Catalog updated' : 'Catalog created');

      // Close dialog + reset edit state
      setDialogOpen(false);
      setEditingCatalog(undefined);

      // Refetch catalogs list
      await queryClient.invalidateQueries({ queryKey: ['catalogs'] });
    },
    onError: () => {
      toast.error(
        editingCatalog ? 'Failed to update catalog' : 'Failed to create catalog'
      );
    },
  });

  function handleCreate() {
    setEditingCatalog(undefined);
    setDialogOpen(true);
  }

  function handleEdit(catalog: Catalog) {
    setEditingCatalog(catalog);
    setDialogOpen(true);
  }

  function handleSubmit(values: CatalogFormValues) {
    upsertCatalogMutation.mutate(values);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>Catalogs</h1>
        <Button onClick={handleCreate}>
          <Plus className="size-4" />
          Create Catalog
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {catalogs.map(catalog => (
          <div key={catalog.id} className="flex items-center justify-between border p-2">
            <Link href={`${pathname}/${catalog.id}/categories`}>{catalog.name}</Link>
            <Button variant="ghost" size="icon" onClick={() => handleEdit(catalog)}>
              <Pencil className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <ResponsiveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingCatalog ? 'Edit Catalog' : 'Create Catalog'}
        description={editingCatalog ? 'Update catalog details' : 'Create a new catalog'}
      >
        <CatalogForm
          key={editingCatalog?.id ?? 'create'}
          defaultValues={editingCatalog}
          onSubmit={handleSubmit}
        >
          <Button
            type="submit"
            disabled={upsertCatalogMutation.isPending}
            className="w-full"
          >
            {upsertCatalogMutation.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {editingCatalog ? 'Save Changes' : 'Create Catalog'}
          </Button>
        </CatalogForm>
      </ResponsiveDialog>
    </div>
  );
}
export default CatalogsPage;
