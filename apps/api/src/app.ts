import { Hono } from 'hono';
import { problem, unexpectedError } from './http.js';
import type { AppEnv } from './http.js';
import { requestContext, requireConfiguration } from './middleware/request-context.js';
import type { Platform, WorkerBindings } from './platform.js';
import { healthRoutes } from './routes/health.js';

export function createApp(createPlatform: (bindings: WorkerBindings) => Platform): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.use('*', requestContext(createPlatform));
  app.use('*', requireConfiguration);
  app.route('/api/v1/health', healthRoutes);

  app.notFound((c) => problem(c, 404, 'not_found'));
  app.onError((error, c) => unexpectedError(c, error));

  return app;
}
