import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';

export function GeneralSettings() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold">General Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="mb-4 text-lg font-medium">Account Information</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input id="name" placeholder="Enter your account name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-medium">Language & Region</h3>
              <p className="text-muted-foreground text-sm">
                Set your preferred language and timezone
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input id="language" defaultValue="English (US)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" defaultValue="UTC-8 (Pacific Time)" />
            </div>
            <div className="flex justify-end">
              <Button>Update</Button>
            </div>
          </div>
        </Card>

        <Card className="border-destructive p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-destructive mb-2 text-lg font-medium">Danger Zone</h3>
              <p className="text-muted-foreground text-sm">
                Permanently delete your account and all associated data
              </p>
            </div>
            <div className="flex justify-end">
              <Button variant="destructive">Delete Account</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
