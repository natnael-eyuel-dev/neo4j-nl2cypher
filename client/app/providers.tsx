'use client';

import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';

// create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <DatabaseProvider>
            {children}
            {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
          </DatabaseProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
