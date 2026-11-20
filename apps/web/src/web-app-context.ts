import { createContext, useContext } from 'react';
import type { WebApp } from './bootstrap.js';

export const WebAppContext = createContext<WebApp | undefined>(undefined);

export function useWebApp(): WebApp {
  const app = useContext(WebAppContext);
  if (app === undefined) throw new Error('useWebApp is used outside <App>');
  return app;
}
