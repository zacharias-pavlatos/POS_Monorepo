'use client';

import type React from 'react';
import { useParams } from 'next/navigation';
import { SettingsNavDesktop } from './_components/settings-nav-desktop';
import { BackButton } from '@/components/back-button';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { orgId } = useParams<{ orgId: string }>();

  return (
    <div className="bg-background min-h-screen w-full">
      {/* Desktop */}
      <div className="hidden md:flex">
        <SettingsNavDesktop />
        <main className="flex-1 p-8">{children}</main>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <header className="bg-background border-border sticky top-0 flex items-center gap-3 border-b px-4 py-3">
          <BackButton fallbackHref={`/organizations/${orgId}`} />
          <h1 className="font-semibold">Settings</h1>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
