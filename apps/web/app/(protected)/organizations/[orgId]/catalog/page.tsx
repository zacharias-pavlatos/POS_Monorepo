'use client';

import * as React from 'react';
import { Plus, Pencil } from 'lucide-react';
import { toast } from '@repo/ui/components/sonner';

import { Button } from '@repo/ui/components/button';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { rpcClient } from '@/lib/rpc-client';
import { CatalogForm, type CatalogFormValues } from '@/components/forms/catalog-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Infer from the rpc client's return type
type Catalog = Awaited<ReturnType<typeof rpcClient.catalogs.all>>[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPayload(values: CatalogFormValues) {
  return {
    name: values.name,
    description: values.description || null,
    internalNotes: values.internalNotes || null,
    fromDate: values.fromDate,
    toDate: values.toDate,
    fromTime: values.fromTime || null,
    toTime: values.toTime || null,
    weekDays: values.weekDays,
    isActive: values.isActive,
    color: values.color || null,
    // TODO: handle file upload to S3/R2, then send URL
    image: typeof values.image === 'string' ? values.image : null,
  };
}

function toDefaultValues(catalog: Catalog): Partial<CatalogFormValues> {
  return {
    name: catalog.name,
    description: catalog.description ?? '',
    internalNotes: catalog.internalNotes ?? '',
    fromDate: new Date(catalog.fromDate),
    toDate: catalog.toDate ? new Date(catalog.toDate) : null,
    fromTime: catalog.fromTime ?? '',
    toTime: catalog.toTime ?? '',
    weekDays: catalog.weekDays,
    isActive: catalog.isActive,
    color: catalog.color,
    image: catalog.image,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function CatalogsPage() {
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
      const payload = toPayload(values);

      if (editingCatalog) {
        return rpcClient.catalogs.update({
          id: editingCatalog.id,
          ...payload,
        });
      }

      return rpcClient.catalogs.create(payload);
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

      {catalogs.map(catalog => (
        <div key={catalog.id} className="flex items-center justify-between">
          <span>{catalog.name}</span>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(catalog)}>
            <Pencil className="size-4" />
          </Button>
        </div>
      ))}

      <ResponsiveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingCatalog ? 'Edit Catalog' : 'Create Catalog'}
        description={editingCatalog ? 'Update catalog details' : 'Create a new catalog'}
      >
        <CatalogForm
          key={editingCatalog?.id ?? 'create'}
          defaultValues={editingCatalog ? toDefaultValues(editingCatalog) : undefined}
          onSubmit={handleSubmit}
          isSubmitting={upsertCatalogMutation.isPending}
          submitLabel={editingCatalog ? 'Save Changes' : 'Create Catalog'}
        />
      </ResponsiveDialog>
    </div>
  );
}
export default CatalogsPage;
