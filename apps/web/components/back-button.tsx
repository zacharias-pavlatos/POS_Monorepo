'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

type BackButtonProps = {
  fallbackHref?: string;
};

/**
 * Navigates up one level in the URL hierarchy.
 * /settings/profile → /settings
 * /settings/profile/avatar → /settings/profile
 */
export function BackButton({ fallbackHref = '/' }: BackButtonProps) {
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);
  segments.pop();
  const parentPath = segments.length > 0 ? `/${segments.join('/')}` : fallbackHref;

  return (
    <Link href={parentPath} className="hover:bg-accent -ml-1 rounded-md p-1">
      <ChevronLeft className="h-5 w-5" />
    </Link>
  );
}
