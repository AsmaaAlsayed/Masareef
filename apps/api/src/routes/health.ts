import { Hono } from 'hono';
import { problem } from '../http.js';
import type { AppEnv } from '../http.js';
import { checkReadiness } from '../services/health.js';

export const healthRoutes = new Hono<AppEnv>()
  .get('/live', (c) => c.json({ status: 'ok' }))
  .get('/ready', async (c) => {
    const readiness = await checkReadiness(c.get('platform'));
    if (readiness.ready) return c.json({ status: 'ok' });

    c.set('failure', {
      errorCode: readiness.reason,
      error: readiness.reason === 'database_unavailable' ? readiness.error : undefined,
    });
    return problem(c, 503, 'not_ready');
  });
