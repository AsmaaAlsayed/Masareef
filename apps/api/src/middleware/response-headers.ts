import type { MiddlewareHandler } from 'hono';
import { isApiPath } from '../http.js';
import type { AppEnv } from '../http.js';
import { ALLOWED_ORIGIN } from './cors.js';

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://accounts.google.com/gsi/client",
  "style-src 'self' https://accounts.google.com/gsi/style",
  "style-src-attr 'unsafe-inline'",
  'frame-src https://accounts.google.com/gsi/',
  "connect-src 'self' https://accounts.google.com/gsi/",
  "img-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/** Architecture, "Transport and headers" (NFR-020). */
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'microphone=(), camera=(), geolocation=()',
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
} as const;

/**
 * Must stay the outermost middleware: it runs after every other layer has finished, including the
 * catch-all, so a refusal or a failure cannot lose these headers. The Android client also needs
 * the CORS header on those responses, or it could not read the error.
 */
export const responseHeaders: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next();

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) c.header(name, value);

  if (isApiPath(c.req.path)) {
    c.header('Vary', 'Origin', { append: true });
    if (c.req.header('Origin') === ALLOWED_ORIGIN) {
      c.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    }
  }
};
