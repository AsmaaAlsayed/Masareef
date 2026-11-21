import type { Context, MiddlewareHandler } from 'hono';
import { routePath } from 'hono/route';
import { loadConfig } from '../config.js';
import { isApiPath, unexpectedError } from '../http.js';
import type { AppEnv } from '../http.js';
import { ANDROID_CLIENT, createLogger } from '../logger.js';
import type { Platform, WorkerBindings } from '../platform.js';

/** The registered template, never the raw path, which could hold personal data. */
function routeTemplate(c: Context<AppEnv>): string {
  if (c.get('servedStatic') === true) return 'static';
  const template = routePath(c, -1);
  return template.endsWith('*') ? 'unmatched' : template;
}

function clientName(c: Context<AppEnv>): string {
  const header = c.req.header('X-Client');
  return header !== undefined && ANDROID_CLIENT.test(header) ? header : 'web';
}

export function requestContext(
  createPlatform: (bindings: WorkerBindings) => Platform,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const platform = createPlatform(c.env);
    const startedAt = platform.now();
    // Always generated here: an inbound X-Request-Id is not trusted.
    const requestId = platform.newRequestId();
    c.set('platform', platform);
    c.set('requestId', requestId);

    try {
      await next();
    } catch (thrown) {
      // Hono's onError receives Error instances only; anything else that is thrown arrives here.
      c.res = unexpectedError(c, thrown);
    }

    c.header('X-Request-Id', requestId);
    if (isApiPath(c.req.path)) c.header('Cache-Control', 'no-store');

    const finishedAt = platform.now();
    const failure = c.get('failure');
    const cause = failure?.error;
    createLogger(platform.writeLog)({
      ts: new Date(finishedAt).toISOString(),
      level: c.res.status >= 500 ? 'error' : 'info',
      request_id: requestId,
      method: c.req.method,
      route: routeTemplate(c),
      status: c.res.status,
      duration_ms: finishedAt - startedAt,
      release: c.get('release'),
      client: clientName(c),
      error_code: failure?.errorCode,
      stack: cause instanceof Error ? cause.stack : undefined,
      missing_variables: failure?.missingVariables,
    });
  };
}

/** Runs on every request, so a Worker with incomplete configuration serves nothing. */
export const requireConfiguration: MiddlewareHandler<AppEnv> = async (c, next) => {
  const config = loadConfig(c.get('platform').configuration);
  c.set('config', config);
  c.set('release', config.release);
  await next();
};
