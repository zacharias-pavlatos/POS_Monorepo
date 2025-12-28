import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { CreditCard } from 'lucide-react';

export function BillingSettings() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold">Billing Settings</h1>
        <p className="text-muted-foreground">
          Manage your subscription and payment methods
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-medium">Current Plan</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                You are currently on the Pro plan
              </p>
            </div>
            <div className="bg-accent flex items-center justify-between rounded-lg p-4">
              <div>
                <p className="text-lg font-semibold">Pro Plan</p>
                <p className="text-muted-foreground text-sm">$29/month</p>
              </div>
              <Button variant="outline">Change Plan</Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Payment Methods</h3>
              <Button variant="outline" size="sm">
                Add New
              </Button>
            </div>
            <div className="border-border flex items-center gap-4 rounded-lg border p-4">
              <div className="bg-muted flex h-10 w-10 items-center justify-center rounded">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-muted-foreground text-sm">Expires 12/24</p>
              </div>
              <Button variant="ghost" size="sm">
                Remove
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-medium">Billing History</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                View and download your invoices
              </p>
            </div>
            <div className="space-y-2">
              <div className="hover:bg-accent flex items-center justify-between rounded-lg p-3">
                <div>
                  <p className="font-medium">December 2024</p>
                  <p className="text-muted-foreground text-sm">$29.00</p>
                </div>
                <Button variant="ghost" size="sm">
                  Download
                </Button>
              </div>
              <div className="hover:bg-accent flex items-center justify-between rounded-lg p-3">
                <div>
                  <p className="font-medium">November 2024</p>
                  <p className="text-muted-foreground text-sm">$29.00</p>
                </div>
                <Button variant="ghost" size="sm">
                  Download
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
