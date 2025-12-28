/**
 * Server-side authentication gate for protected routes.
 *
 * Validates user session before rendering any child pages. If no valid session exists,
 * redirects to /login. All routes under this layout require authentication.
 *
 * **Why we do this:**
 * - Provides a clean way to protect pages/layouts
 * - Automatically redirects unauthenticated users
 * - Runs on the server BEFORE the page renders (no flash of content)
 *
 *  **Why we forward headers:**
 * - Session cookie is in the browser's request to Next.js
 * - We forward it to Hono so it can validate the session
 * - Without this, Hono wouldn't know who the user is
 *
 * **Security Note:**
 * - This is NOT the only security layer
 * - Your Hono API still validates sessions on every request
 * - This is UX + first line of defense
 * - Real security = Hono validates before returning data
 */

import { ReactNode } from 'react';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { authClient } from '@/lib/auth-client';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();

  const { data } = await authClient.getSession({
    fetchOptions: {
      headers: headersList,
    },
  });

  if (!data?.user) redirect('/login');

  console.log('ProtectedLayout-GET SESSION');

  return <>{children}</>;
}
