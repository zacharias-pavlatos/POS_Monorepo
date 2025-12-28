import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Label } from '@repo/ui/components/label';
import { Separator } from '@repo/ui/components/separator';
import { Switch } from '@repo/ui/components/switch';

export function NotificationSettings() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-semibold">Notification Settings</h1>
        <p className="text-muted-foreground">Control how you receive notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="account-activity">Account Activity</Label>
              <p className="text-muted-foreground text-sm">
                Receive emails about your account activity
              </p>
            </div>
            <Switch id="account-activity" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing">Marketing Emails</Label>
              <p className="text-muted-foreground text-sm">
                Receive promotional and marketing emails
              </p>
            </div>
            <Switch id="marketing" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="product-updates">Product Updates</Label>
              <p className="text-muted-foreground text-sm">
                Get notified about new features and updates
              </p>
            </div>
            <Switch id="product-updates" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
              <p className="text-muted-foreground text-sm">
                Show notifications on your desktop
              </p>
            </div>
            <Switch id="desktop-notifications" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mobile-push">Mobile Push</Label>
              <p className="text-muted-foreground text-sm">
                Receive push notifications on mobile devices
              </p>
            </div>
            <Switch id="mobile-push" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
