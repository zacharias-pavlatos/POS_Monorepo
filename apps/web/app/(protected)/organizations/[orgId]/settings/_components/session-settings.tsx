import { authClient } from '@/lib/auth-client';
import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Switch } from '@repo/ui/components/switch';
// import { useRouter } from 'next/navigation';

import { UAParser } from 'ua-parser-js';

export async function SessionsSettings() {
  //   const router = useRouter();

  const { data: session } = await authClient.getSession();
  const sessions = await authClient.listSessions();

  console.log('-----><', session, sessions);

  //   if (!sessions || !session) return null;

  //   const otherSessions = sessions.filter(s => s.token !== currentSessionToken);
  //   const currentSession = sessions.find(s => s.token === currentSessionToken);

  //   const userAgentInfo = session.userAgent ? UAParser(session.userAgent) : null;

  //   console.log('currentSession:', currentSessionToken);

  //   function revokeOtherSessions() {
  //     return authClient.revokeOtherSessions(undefined, {
  //       onSuccess: () => {
  //         router.refresh();
  //       },
  //     });
  //   }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold">Sessions Settings</h1>
        <p className="text-muted-foreground">Manage your session</p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="mb-4 text-lg font-medium">Active session</h3>
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

// function getBrowserInformation() {
//   if (userAgentInfo == null) return 'Unknown Device';
//   if (userAgentInfo.browser.name == null && userAgentInfo.os.name == null) {
//     return 'Unknown Device';
//   }

//   if (userAgentInfo.browser.name == null) return userAgentInfo.os.name;
//   if (userAgentInfo.os.name == null) return userAgentInfo.browser.name;

//   return `${userAgentInfo.browser.name}, ${userAgentInfo.os.name}`;
// }
