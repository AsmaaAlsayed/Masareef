import type { Context, MiddlewareHandler } from 'hono';
import { isApiPath, refuse } from '../http.js';
import type { AppEnv } from '../http.js';
import { PUBLIC_ROUTES } from '../public-routes.js';
import type { Authenticator } from '../session.js';

/**
 * Compares the path as sent. The router matches a percent-decoded path, so `/health/%6Cive` would
 * reach the `live` handler; here it is simply not on the list.
 */
function isPublicRoute(c: Context<AppEnv>): boolean {
  const path = new URL(c.req.url).pathname;
  const method = c.req.method === 'HEAD' ? 'GET' : c.req.method;
  return PUBLIC_ROUTES.some((route) => route.method === method && route.path === path);
}

/**
 * Default deny (FR-019 criterion 2). A request continues only if it is on the public list or, under
 * `/api`, proves a session. Nothing is served outside `/api` yet, so those paths end here too.
 */
export function accessControl(authenticate: Authenticator): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (isPublicRoute(c)) return next();
    if (!isApiPath(c.req.path)) return refuse(c, 404, 'not_found');

    const session = await authenticate(c.req.raw, c.get('platform'));
    if (session === null) {
      c.header('WWW-Authenticate', 'Bearer');
      return refuse(c, 401, 'unauthenticated');
    }
    c.set('session', session);
    return next();
  };
}
