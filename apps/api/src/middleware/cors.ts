import type { MiddlewareHandler } from 'hono';
import { isApiPath } from '../http.js';
import type { AppEnv } from '../http.js';

/** Capacitor's Android WebView, the only cross-origin caller. Compared exactly. */
export const ALLOWED_ORIGIN = 'https://localhost';

// What the API in the architecture ("Interfaces") uses: no route is PUT, and Android sends a bearer
// token, JSON and X-Client. Cookies are same-origin only, so credentials are never allowed.
const ALLOWED_METHODS = ['GET', 'POST', 'PATCH', 'DELETE'];
const ALLOWED_HEADERS = ['Authorization', 'Content-Type', 'X-Client'];
const LOWER_CASE_ALLOWED_HEADERS = new Set(ALLOWED_HEADERS.map((name) => name.toLowerCase()));
const PREFLIGHT_MAX_AGE_SECONDS = '600';

function headersAreAllowed(requested: string | undefined): boolean {
  if (requested === undefined) return true;
  return requested
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name !== '')
    .every((name) => LOWER_CASE_ALLOWED_HEADERS.has(name));
}

/**
 * Answers preflights here, so they never reach authentication or a route. A refused preflight is
 * the same 204 without the allow headers: the browser is what enforces the refusal.
 */
export const corsPreflight: MiddlewareHandler<AppEnv> = async (c, next) => {
  const origin = c.req.header('Origin');
  const method = c.req.header('Access-Control-Request-Method');
  const isPreflight = c.req.method === 'OPTIONS' && origin !== undefined && method !== undefined;
  if (!isPreflight || !isApiPath(c.req.path)) return next();

  if (
    origin === ALLOWED_ORIGIN &&
    ALLOWED_METHODS.includes(method) &&
    headersAreAllowed(c.req.header('Access-Control-Request-Headers'))
  ) {
    c.header('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
    c.header('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
    c.header('Access-Control-Max-Age', PREFLIGHT_MAX_AGE_SECONDS);
  }
  return c.body(null, 204);
};
