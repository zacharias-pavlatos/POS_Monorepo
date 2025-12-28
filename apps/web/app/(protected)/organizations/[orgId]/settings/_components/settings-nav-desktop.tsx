'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { settingsCategories } from '../settings-config';
import { cn } from '@repo/ui/lib/utils';

export function SettingsNavDesktop() {
  const pathname = usePathname();
  const { orgId } = useParams<{ orgId: string }>();
  const basePath = `/organizations/${orgId}/settings`;

  return (
    <aside className="border-border bg-card min-h-screen w-64 border-r">
      <div className="p-6">
        <h2 className="mb-6 text-lg font-semibold">Settings</h2>
        <nav className="space-y-1">
          {settingsCategories.map((category, index) => {
            const Icon = category.icon;
            const href = `${basePath}/${category.slug}`;
            // Active when URL matches directly, or when on [/settings] and the first category in the list is the default.
            const isActive = pathname === href || (pathname === basePath && index === 0);

            return (
              <Link
                key={category.slug}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {category.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
