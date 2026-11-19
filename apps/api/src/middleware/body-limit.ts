import type { MiddlewareHandler } from 'hono';
import { refuse } from '../http.js';
import type { AppEnv } from '../http.js';

/** NFR-019 says 16 KB; read as 16 x 1024 bytes. */
export const MAX_BODY_BYTES = 16_384;

function declaresTooMuch(contentLength: string | null): boolean {
  return (
    contentLength !== null && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_BODY_BYTES
  );
}

/** The whole body, or undefined as soon as it passes the limit. Holds at most the limit. */
async function readWithinLimit(
  body: ReadableStream<Uint8Array>,
): Promise<Uint8Array<ArrayBuffer> | undefined> {
  const reader = body.getReader();
  const buffer = new Uint8Array(MAX_BODY_BYTES);
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return buffer.subarray(0, size);
    if (size + value.byteLength > MAX_BODY_BYTES) {
      // The refusal is already decided, so a failure to cancel changes nothing for this request.
      reader.cancel().catch(() => undefined);
      return undefined;
    }
    buffer.set(value, size);
    size += value.byteLength;
  }
}

/**
 * Counts the bytes actually received. Content-Length can only refuse early and is never trusted to
 * accept, which is why Hono's own bodyLimit (it skips counting when the header is present) is not
 * used. The accepted body is put back on the request for the route to read.
 */
export const bodyLimit: MiddlewareHandler<AppEnv> = async (c, next) => {
  const request = c.req.raw;
  if (request.body === null) return next();

  const contentLength = request.headers.get('Content-Length');
  if (declaresTooMuch(contentLength)) return refuse(c, 413, 'too_large');

  const body = await readWithinLimit(request.body as ReadableStream<Uint8Array>);
  if (body === undefined) return refuse(c, 413, 'too_large');

  // A raw client can send a body with these, but a Request cannot be built with one. No handler
  // for them reads a body, so it is counted and dropped.
  if (c.req.method === 'GET' || c.req.method === 'HEAD') return next();

  const headers = new Headers(request.headers);
  if (contentLength !== null) headers.set('Content-Length', String(body.byteLength));
  c.req.raw = new Request(request, { body, headers });
  return next();
};
