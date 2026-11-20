import { createRoute, z } from '@hono/zod-openapi';
import { problem } from '../http.js';
import { createRouter, problemResponses } from '../openapi.js';
import { checkReadiness } from '../services/health.js';

const StatusSchema = z.object({ status: z.literal('ok') }).openapi('Status');

const ok = {
  content: { 'application/json': { schema: StatusSchema } },
} as const;

const live = createRoute({
  method: 'get',
  path: '/live',
  operationId: 'getLiveness',
  tags: ['health'],
  summary: 'The Worker answers',
  responses: {
    200: { ...ok, description: 'Alive' },
    ...problemResponses(500),
  },
});

const ready = createRoute({
  method: 'get',
  path: '/ready',
  operationId: 'getReadiness',
  tags: ['health'],
  summary: 'A SELECT 1 on the database succeeds within 2 seconds',
  responses: {
    200: { ...ok, description: 'Ready' },
    ...problemResponses(500, 503),
  },
});

export const healthRoutes = createRouter()
  .openapi(live, (c) => c.json({ status: 'ok' as const }, 200))
  .openapi(ready, async (c) => {
    const readiness = await checkReadiness(c.get('platform'));
    if (readiness.ready) return c.json({ status: 'ok' as const }, 200);

    c.set('failure', {
      errorCode: readiness.reason,
      error: readiness.reason === 'database_unavailable' ? readiness.error : undefined,
    });
    return problem(c, 503, 'not_ready');
  });
