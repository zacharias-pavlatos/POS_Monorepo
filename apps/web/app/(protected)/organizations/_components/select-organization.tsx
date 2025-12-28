'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { authClient } from '@/lib/auth-client';
import { toast } from '@repo/ui/components/sonner';

export default function OrganizationSelect() {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const { data: organizations } = authClient.useListOrganizations();

  const router = useRouter();
  // const { toast } = useToast();
  if (organizations == null || organizations.length === 0) {
    return null;
  }

  async function setActiveOrganization(organizationId: string) {
    try {
      await authClient.organization.setActive({ organizationId });
      router.push(`/organizations/${organizationId}`);
    } catch (error) {
      toast.error('Failed to switch organization');
    }
  }

  return (
    <Select value={activeOrganization?.id ?? ''} onValueChange={setActiveOrganization}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an organization" />
      </SelectTrigger>
      <SelectContent>
        {organizations.map(org => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
