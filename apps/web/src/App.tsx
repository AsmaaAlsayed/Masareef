import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { I18nextProvider } from 'react-i18next';
import type { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import type { WebApp } from './bootstrap.js';
import { WebAppContext } from './web-app-context.js';

export interface AppProps {
  readonly app: WebApp;
  readonly router: ReturnType<typeof createBrowserRouter>;
}

export function App({ app, router }: AppProps) {
  return (
    <StrictMode>
      <WebAppContext value={app}>
        <I18nextProvider i18n={app.i18n}>
          <QueryClientProvider client={app.queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </I18nextProvider>
      </WebAppContext>
    </StrictMode>
  );
}
