import * as React from 'react';
import { Loader2, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/alert-dialog';
import { Button } from '@repo/ui/components/button';

type DangerZoneProps = {
  /** The action label shown on the trigger button (e.g., "Delete Workstation") */
  actionLabel: string;
  /** Brief description of the destructive action */
  description: string;
  /** Confirmation dialog title */
  confirmTitle?: string;
  /** Confirmation dialog description */
  confirmDescription?: string;
  /** Confirmation button label */
  confirmLabel?: string;
  /** Called when the user confirms the action */
  onConfirm: () => void;
  /** Disables the trigger button */
  isLoading?: boolean;
};

export function DangerZone({
  actionLabel,
  description,
  confirmTitle = 'Are you sure?',
  confirmDescription = 'This action cannot be undone.',
  confirmLabel = actionLabel,
  onConfirm,
  isLoading,
}: DangerZoneProps) {
  return (
    <div className="border-destructive/30 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-destructive text-sm font-medium">Danger Zone</p>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isLoading}
              className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={onConfirm}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                {confirmLabel}
              </AlertDialogAction>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
