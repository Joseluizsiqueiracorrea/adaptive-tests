/**
 * Discovery Lens React App
 * Premium UI with Liquid Glass design system and virtual scrolling
 */

import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { DiscoveryLens } from './components/DiscoveryLens';
import { ThemeProvider } from './contexts/ThemeContext';
import { VSCodeProvider } from './contexts/VSCodeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import './styles/globals.css';
import './styles/liquid-glass.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false
    }
  }
});

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <VSCodeProvider>
            <Suspense fallback={<LoadingScreen />}>
              <div className="app-container liquid-glass">
                <DiscoveryLens />
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    className: 'toast-notification',
                    duration: 4000,
                    style: {
                      background: 'var(--vscode-notifications-background)',
                      color: 'var(--vscode-notifications-foreground)',
                      border: '1px solid var(--vscode-notifications-border)'
                    }
                  }}
                />
              </div>
            </Suspense>
          </VSCodeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};