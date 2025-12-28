'use client';

import * as React from 'react';
import { ChevronsUpDown, Plus } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@repo/ui/components/sidebar';
import { authClient } from '@/lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/avatar';
import { useRouter } from 'next/navigation';
import { toast } from '@repo/ui/components/sonner';

export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const { data: activeOrganization } = authClient.useActiveOrganization();
  const { data: organizations } = authClient.useListOrganizations();

  if (!activeOrganization || !organizations) {
    return null;
  }

  async function setActiveOrganization(organizationId: string) {
    await authClient.organization.setActive(
      { organizationId },
      {
        onError: error => {
          console.error('Failed to switch organization:', error);
          toast.error(error.error.message || 'Failed to switch organization');
        },
      }
    );

    router.push('/organizations/' + organizationId);
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {activeOrganization.logo ? (
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={activeOrganization.logo}
                      alt={activeOrganization.name}
                    />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                </div>
              ) : null}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeOrganization.name}</span>
                <span className="truncate text-xs">{activeOrganization.slug}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((organization, index) => (
              <DropdownMenuItem
                key={organization.id}
                onClick={() => setActiveOrganization(organization.id)}
                className="gap-2 p-2"
              >
                {organization.logo ? (
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={organization.logo} alt={organization.name} />
                      <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                    </Avatar>
                  </div>
                ) : null}
                {organization.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add Organization</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
