/**
 * Custom hook for handling user logout functionality with Better Auth.
 *
 * Provides a logout function with loading and error states, automatically
 * redirecting users to the login page upon successful logout and invalidating
 * the Next.js cache to ensure authentication state is properly cleared.
 */

import { useState } from 'react';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function useLogout() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/login');
            router.refresh(); // invalidates cache
          },
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  return { logout, isLoading, error };
}
