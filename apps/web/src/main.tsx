import { createApiClient } from '@masareef/api-types';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { App } from './App.js';
import { createWebApp, deviceLanguageStore } from './bootstrap.js';
import { devicePolicySeenStore } from './policies/notice.js';
import { appRoutes } from './routes.js';
import './styles.css';

const app = createWebApp({
  languages: navigator.languages.length > 0 ? navigator.languages : [navigator.language],
  store: deviceLanguageStore(),
  policySeen: devicePolicySeenStore(),
  // Same origin: the Worker serves this page and the API.
  api: createApiClient(),
  document,
});

const container = document.getElementById('root');
if (container === null) throw new Error('index.html has no #root element');
createRoot(container).render(<App app={app} router={createBrowserRouter(appRoutes)} />);
