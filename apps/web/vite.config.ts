import react from '@vitejs/plugin-react';
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Workspace packages are compiled from their TypeScript sources (the `masareef-source` export
    // condition), so the web build does not depend on their build order.
    conditions: ['masareef-source', ...defaultClientConditions],
  },
  build: {
    // Architecture C1: Chrome 138 is the last Chrome on Android 8 and 9; 111 is the lowest WebView
    // the Android shell accepts.
    target: ['chrome111', 'firefox128', 'safari16.4'],
    // Every browser in the target supports modulepreload, and the polyfill is the one piece of
    // script Vite would add for it; leaving it out keeps the output to the bundled modules.
    modulePreload: { polyfill: false },
    // Fonts, images and styles are always files: the Content-Security-Policy allows no inline
    // style blocks, and `data:` only for images.
    assetsInlineLimit: 0,
  },
  server: {
    // `npm run dev`: the API from `wrangler dev` on the same origin, as in production.
    proxy: { '/api': 'http://localhost:8787' },
  },
});
