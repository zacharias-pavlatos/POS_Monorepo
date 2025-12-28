import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';

export function ProfileSettings() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Update your personal information and profile picture
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="mb-4 text-lg font-medium">Profile Picture</h3>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/placeholder.svg?height=80&width=80" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Upload New
                  </Button>
                  <Button variant="ghost" size="sm">
                    Remove
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="@johndoe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" placeholder="Tell us about yourself" />
            </div>
            <div className="flex justify-end">
              <Button>Save Profile</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
