'use client';

import * as React from 'react';
import { Plus, Pencil } from 'lucide-react';
import { toast } from '@repo/ui/components/sonner';

import { Button } from '@repo/ui/components/button';
import { ResponsiveDialog } from '@/components/responsive-dialog';
import { rpcClient } from '@/lib/rpc-client';
import { WorkstationForm } from '@/components/forms/workstation-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { WorkstationFormValues } from '@/components/forms/workstation-form';
import type { SelectWorkStationType as Workstation } from '@repo/orpc/contracts';

export function WorkstationsPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingWorkstation, setEditingWorkstation] = React.useState<Workstation>();

  const queryClient = useQueryClient();
  // Fetch workstations
  const { data: workstations = [], isLoading } = useQuery({
    queryKey: ['workstations'],
    queryFn: () => rpcClient.workstations.all(),
  });

  // One mutation that handles both create + update
  const upsertWorkstationMutation = useMutation({
    mutationFn: async (values: WorkstationFormValues) => {
      return editingWorkstation
        ? rpcClient.workstations.update({ id: editingWorkstation.id, ...values })
        : rpcClient.workstations.create(values);
    },
    onSuccess: async () => {
      toast.success(editingWorkstation ? 'Workstation updated' : 'Workstation created');
      // Close dialog + reset edit state
      setDialogOpen(false);
      setEditingWorkstation(undefined);
      // Refetch workstations list
      await queryClient.invalidateQueries({ queryKey: ['workstations'] });
    },
    onError: () => {
      toast.error(
        editingWorkstation
          ? 'Failed to update workstation'
          : 'Failed to create workstation'
      );
    },
  });

  const deleteWorkstationMutation = useMutation({
    mutationFn: () => rpcClient.workstations.delete({ id: editingWorkstation!.id }),
    onSuccess: async () => {
      toast.success('Workstation deleted');
      setDialogOpen(false);
      setEditingWorkstation(undefined);
      await queryClient.invalidateQueries({ queryKey: ['workstations'] });
    },
    onError: () => {
      toast.error('Failed to delete workstation');
    },
  });

  function handleCreate() {
    setEditingWorkstation(undefined);
    setDialogOpen(true);
  }

  function handleEdit(workstation: Workstation) {
    setEditingWorkstation(workstation);
    setDialogOpen(true);
  }

  function handleSubmit(values: WorkstationFormValues) {
    upsertWorkstationMutation.mutate(values);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>Workstations</h1>
        <Button onClick={handleCreate}>
          <Plus className="size-4" />
          Create Workstation
        </Button>
      </div>

      {workstations.map(workstation => (
        <div key={workstation.id} className="flex items-center justify-between">
          <span>{workstation.name}</span>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(workstation)}>
            <Pencil className="size-4" />
          </Button>
        </div>
      ))}

      <ResponsiveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingWorkstation ? 'Edit Workstation' : 'Create Workstation'}
        description={
          editingWorkstation ? 'Update workstation details' : 'Create a new workstation'
        }
      >
        <WorkstationForm
          key={editingWorkstation?.id ?? 'create'}
          defaultValues={editingWorkstation}
          onSubmit={handleSubmit}
          isSubmitting={upsertWorkstationMutation.isPending}
          submitLabel={editingWorkstation ? 'Save Changes' : 'Create Workstation'}
          onDelete={editingWorkstation ? () => deleteWorkstationMutation.mutate() : undefined}
          isDeleting={deleteWorkstationMutation.isPending}
        />
      </ResponsiveDialog>
    </div>
  );
}
export default WorkstationsPage;
