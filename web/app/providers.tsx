'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SocketProvider } from '@/lib/socket-context';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30000, // 30 seconds
        },
    },
});

export function Providers({ children }: { children: React.ReactNode }) {
    const hydrate = useAuthStore((state) => state.hydrate);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <SocketProvider>
                    {children}
                </SocketProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
