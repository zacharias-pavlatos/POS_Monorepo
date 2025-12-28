'use client';

import Link from 'next/link';
import { settingsCategories } from '../settings-config';
import { useParams, usePathname } from 'next/navigation';

export function SettingsNavMobile() {
  const pathname = usePathname();
  const { orgId } = useParams<{ orgId: string }>();
  const basePath = `/organizations/${orgId}/settings`;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
      <div className="space-y-2">
        {settingsCategories.map(category => {
          const Icon = category.icon;
          const href = `${basePath}/${category.slug}`;

          return (
            <Link key={category.slug} href={href} className="block">
              <div className="bg-card border-border hover:bg-accent rounded-lg border p-4 transition-colors">
                <div className="flex items-center gap-3">
                  <Icon className="text-muted-foreground h-5 w-5" />
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
