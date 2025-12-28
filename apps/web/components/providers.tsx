'use client';

import * as React from 'react';
import { useState } from 'react';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from '@repo/ui/components/sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createQueryClient } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        enableColorScheme
        disableTransitionOnChange
      >
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster position="top-center" />
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
