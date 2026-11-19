import { Hono } from 'hono';
import { problem, unexpectedError } from './http.js';
import type { AppEnv } from './http.js';
import { accessControl } from './middleware/access-control.js';
import { bodyLimit } from './middleware/body-limit.js';
import { corsPreflight } from './middleware/cors.js';
import { requestContext, requireConfiguration } from './middleware/request-context.js';
import { responseHeaders } from './middleware/response-headers.js';
import type { Platform, WorkerBindings } from './platform.js';
import { healthRoutes } from './routes/health.js';
import { noSession } from './session.js';
import type { Authenticator } from './session.js';

export function createApp(
  createPlatform: (bindings: WorkerBindings) => Platform,
  authenticate: Authenticator = noSession,
): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  // The order is part of the security design. Headers wrap everything, so no outcome loses them;
  // the request context wraps every refusal, so each has a request id and a log line. Access
  // control comes before the body limit, so an anonymous caller never makes the Worker read a body.
  app.use('*', responseHeaders);
  app.use('*', requestContext(createPlatform));
  app.use('*', requireConfiguration);
  app.use('*', corsPreflight);
  app.use('*', accessControl(authenticate));
  app.use('*', bodyLimit);

  app.route('/api/v1/health', healthRoutes);

  app.notFound((c) => problem(c, 404, 'not_found'));
  app.onError((error, c) => unexpectedError(c, error));

  return app;
}
