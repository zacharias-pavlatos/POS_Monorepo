import { ReactNode } from 'react';

import { SidebarProvider } from '@repo/ui/components/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { authClient } from '@/lib/auth-client';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '@/env';

export default async function OrganizationsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  const headersList = await headers();

  // Get all organizations user belongs to
  const { data: organizations } = await authClient.organization.list({
    fetchOptions: {
      headers: headersList,
    },
  });

  // Check if user is member of this specific organization
  const membership = organizations?.find(org => org.id === orgId);

  if (!membership) {
    redirect('/organizations');
  }

  // Set active org
  const re = await authClient.organization.setActive({
    organizationId: orgId,
    fetchOptions: {
      headers: {
        cookie: headersList.get('cookie') ?? '',
        origin: headersList.get('origin') ?? env.NEXT_PUBLIC_CLIENT_URL,
      },
    },
  });

  console.log('-------->', re, organizations);

  return (
    <SidebarProvider>
      <AppSidebar />
      {children}
    </SidebarProvider>
  );
}
