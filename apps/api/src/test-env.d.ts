import type { WorkerBindings } from './platform.js';

declare global {
  namespace Cloudflare {
    interface GlobalProps {
      mainModule: typeof import('./index.js');
    }
    interface Env extends WorkerBindings {
      DB: D1Database;
      RELEASE: string;
      ASSETS: Fetcher;
    }
  }
}
