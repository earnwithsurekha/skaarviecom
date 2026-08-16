'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'react-hot-toast';
import { store, persistor } from '@/store';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SessionProvider } from '@/contexts/SessionContext';
import TawkToChat from '@/components/TawkToChat';

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <SessionProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
              duration: 4000,
              style: {
                background: 'rgb(var(--color-surface))',
                color: 'rgb(var(--color-text))',
                border: '1px solid rgb(var(--color-border))',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              },
              success: {
                duration: 3000,
                style: {
                  background: 'rgb(var(--color-success))',
                  color: '#ffffff',
                  border: 'none',
                },
                iconTheme: {
                  primary: '#ffffff',
                  secondary: 'rgb(var(--color-success))',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: 'rgb(var(--color-danger))',
                  color: '#ffffff',
                  border: 'none',
                },
                iconTheme: {
                  primary: '#ffffff',
                  secondary: 'rgb(var(--color-danger))',
                },
              },
            }}
          />
          <TawkToChat />
        </SessionProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
