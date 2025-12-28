import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Switch } from '@repo/ui/components/switch';

export function SecuritySettings() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold">Security Settings</h1>
        <p className="text-muted-foreground">
          Manage your password and authentication preferences
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="mb-4 text-lg font-medium">Change Password</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" />
            </div>
            <div className="flex justify-end">
              <Button>Update Password</Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-medium">Two-Factor Authentication</h3>
              <p className="text-muted-foreground text-sm">
                Add an extra layer of security to your account
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable 2FA</p>
                <p className="text-muted-foreground text-sm">
                  Require a verification code in addition to your password
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
