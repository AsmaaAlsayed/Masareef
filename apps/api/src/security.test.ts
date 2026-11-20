import { env, exports } from 'cloudflare:workers';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { createWorkersPlatform } from './platform.js';
import type { WorkerBindings } from './platform.js';
import { PUBLIC_ROUTES } from './public-routes.js';
import type { Authenticator } from './session.js';

const ORIGIN = 'https://api.example.test';
const LIVE = '/api/v1/health/live';
const READY = '/api/v1/health/ready';
const ECHO = '/api/v1/test-echo';
const THROWS = '/api/v1/test-throw';
const THROWS_VALUE = '/api/v1/test-throw-value';
const LIMIT = 16_384;
const CAPACITOR = 'https://localhost';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'microphone=(), camera=(), geolocation=()',
};

const CSP_DIRECTIVES: Readonly<Record<string, string>> = {
  'default-src': "'self'",
  'script-src': "'self' https://accounts.google.com/gsi/client",
  'style-src': "'self' https://accounts.google.com/gsi/style",
  'style-src-attr': "'unsafe-inline'",
  'frame-src': 'https://accounts.google.com/gsi/',
  'connect-src': "'self' https://accounts.google.com/gsi/",
  'img-src': "'self' data:",
  'object-src': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'",
  'frame-ancestors': "'none'",
};

const logSpy = vi.spyOn(console, 'log');

beforeEach(() => {
  logSpy.mockReset();
  logSpy.mockImplementation(() => undefined);
});

afterEach(() => {
  logSpy.mockReset();
});

function logEntries(): Record<string, unknown>[] {
  return logSpy.mock.calls.map((call) => JSON.parse(String(call[0])) as Record<string, unknown>);
}

/** The deployed entry point: no session can exist on it today. */
function production(path: string, init?: RequestInit): Promise<Response> {
  return exports.default.fetch(`${ORIGIN}${path}`, init);
}

const signedIn: Authenticator = () => Promise.resolve({ userId: 'test-user' });

/** The real application with test routes, so the layers in front of a route can be observed. */
function appWith(authenticate?: Authenticator, bindings: WorkerBindings = defaultBindings()) {
  const app = createApp(createWorkersPlatform, authenticate);
  const routeRuns = { count: 0 };
  app.post(ECHO, async (c) => {
    routeRuns.count += 1;
    const received = await c.req.arrayBuffer();
    return c.body(received, 200, {
      'X-Seen-Content-Length': c.req.header('Content-Length') ?? 'none',
    });
  });
  app.post('/api/v1/test-json', async (c) => c.json(await c.req.json()));
  app.get(THROWS, () => {
    throw new Error('internal detail');
  });
  app.get(THROWS_VALUE, () => {
    // eslint-disable-next-line @typescript-eslint/only-throw-error -- the case under test
    throw 'a thrown string';
  });
  return {
    routeRuns,
    fetch: async (path: string, init?: RequestInit) =>
      app.fetch(new Request(`${ORIGIN}${path}`, init), bindings),
    send: async (request: Request) => app.fetch(request, bindings),
  };
}

function defaultBindings(): WorkerBindings {
  return { DB: env.DB, RELEASE: 'r1' };
}

function failingDatabase(): D1Database {
  return {
    prepare: () => env.DB.prepare('SELECT * FROM table_that_does_not_exist'),
  } as unknown as D1Database;
}

function bytes(length: number): Uint8Array<ArrayBuffer> {
  return Uint8Array.from({ length }, (_, index) => index % 251);
}

interface CountedStream {
  readonly stream: ReadableStream<Uint8Array>;
  readonly progress: { pulls: number; cancelled: boolean };
}

/** Produces nothing until read, so a test can tell how much of a body was actually consumed. */
function countedStream(total: number, chunkSize = 1024): CountedStream {
  const progress = { pulls: 0, cancelled: false };
  let sent = 0;
  const stream: ReadableStream<Uint8Array> = new ReadableStream(
    {
      type: 'bytes',
      pull(controller: ReadableByteStreamController) {
        progress.pulls += 1;
        if (sent >= total) {
          controller.close();
          controller.byobRequest?.respond(0);
          return;
        }
        const size = Math.min(chunkSize, total - sent);
        controller.enqueue(bytes(size));
        sent += size;
      },
      cancel() {
        progress.cancelled = true;
      },
    },
    { highWaterMark: 0 },
  );
  return { stream, progress };
}

function streamedPost(path: string, stream: ReadableStream<Uint8Array>): Request {
  return new Request(`${ORIGIN}${path}`, { method: 'POST', body: stream });
}

async function expectProblem(response: Response, status: number, code: string): Promise<void> {
  expect(response.status).toBe(status);
  expect(response.headers.get('Content-Type')).toBe('application/problem+json');
  const body = await response.json<Record<string, unknown>>();
  expect(body).toMatchObject({ type: 'about:blank', status, code });
  expect(body['request_id']).toBe(response.headers.get('X-Request-Id'));
  expect(Object.keys(body).sort()).toEqual(['code', 'request_id', 'status', 'title', 'type']);
}

function expectSecurityHeaders(response: Response, label: string): void {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    expect(response.headers.get(name), `${name} on ${label}`).toBe(value);
  }
  expect(response.headers.get('Content-Security-Policy'), `CSP on ${label}`).toContain(
    "default-src 'self'",
  );
}

function preflight(origin: string, method = 'POST', headers?: string): RequestInit {
  return {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': method,
      ...(headers === undefined ? {} : { 'Access-Control-Request-Headers': headers }),
    },
  };
}

function cspDirectives(response: Response): Map<string, string> {
  const policy = response.headers.get('Content-Security-Policy') ?? '';
  return new Map(
    policy.split(';').map((directive) => {
      const [name = '', ...sources] = directive.trim().split(/\s+/);
      return [name, sources.join(' ')];
    }),
  );
}

describe('security headers', () => {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    it(`sends_${name.toLowerCase().replaceAll('-', '_')}`, async () => {
      expect((await production(LIVE)).headers.get(name)).toBe(value);
    });
  }

  it('permissions_policy_denies_microphone', async () => {
    const policy = (await production(LIVE)).headers.get('Permissions-Policy') ?? '';
    expect(policy.split(', ')).toContain('microphone=()');
  });

  it('csp_has_exactly_the_architecture_directives', async () => {
    const directives = cspDirectives(await production(LIVE));
    expect(Object.fromEntries(directives)).toEqual(CSP_DIRECTIVES);
  });

  for (const [name, sources] of Object.entries(CSP_DIRECTIVES)) {
    it(`csp_directive_${name.replaceAll('-', '_')}`, async () => {
      expect(cspDirectives(await production(LIVE)).get(name)).toBe(sources);
    });
  }

  it('csp_has_no_unsafe_inline_for_scripts', async () => {
    const directives = cspDirectives(await production(LIVE));
    for (const name of ['default-src', 'script-src']) {
      expect(directives.get(name)).not.toContain('unsafe-inline');
      expect(directives.get(name)).not.toContain('unsafe-eval');
    }
    expect([...directives.keys()].filter((name) => name.startsWith('script-src'))).toEqual([
      'script-src',
    ]);
  });

  it('every_kind_of_response_carries_them', async () => {
    const user = appWith(signedIn);
    const failing = appWith(signedIn, { DB: failingDatabase(), RELEASE: 'r1' });
    const brokenAuthenticator = appWith(() => Promise.reject(new Error('session store down')));
    const cases: readonly (readonly [string, number, Response])[] = [
      ['200 public', 200, await production(LIVE)],
      ['200 HEAD', 200, await production(LIVE, { method: 'HEAD' })],
      ['200 signed in', 200, await user.fetch(ECHO, { method: 'POST', body: 'x' })],
      ['204 preflight', 204, await production(LIVE, preflight(CAPACITOR))],
      ['204 refused preflight', 204, await production(LIVE, preflight('https://evil.example'))],
      ['401 undeclared', 401, await production('/api/v1/unknown')],
      ['404 signed in', 404, await user.fetch('/api/v1/unknown')],
      ['200 page', 200, await production('/not-api')],
      ['200 HEAD page', 200, await production('/not-api', { method: 'HEAD' })],
      ['404 outside api', 404, await production('/not-api', { method: 'POST' })],
      ['413', 413, await user.fetch(ECHO, { method: 'POST', body: bytes(LIMIT + 1) })],
      ['500 error', 500, await user.fetch(THROWS)],
      ['500 thrown value', 500, await user.fetch(THROWS_VALUE)],
      ['500 missing config', 500, await appWith(undefined, { DB: env.DB }).fetch(LIVE)],
      ['500 authenticator', 500, await brokenAuthenticator.fetch('/api/v1/unknown')],
      ['503 not ready', 503, await failing.fetch(READY)],
    ];
    for (const [label, status, response] of cases) {
      expect(response.status, label).toBe(status);
      expectSecurityHeaders(response, label);
      expect(response.headers.get('X-Request-Id'), label).toMatch(UUID);
    }
  });
});

describe('cors', () => {
  it('cors_allows_only_capacitor_origin', async () => {
    const response = await production(LIVE, { headers: { Origin: CAPACITOR } });
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(CAPACITOR);
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull();
    expect(response.headers.get('Vary')).toContain('Origin');
  });

  for (const origin of [
    'http://localhost',
    'https://localhost:8443',
    'https://localhost.evil.example',
    'https://evil.example',
    'https://LOCALHOST',
    'https://localhost/',
    'null',
    '*',
    `${CAPACITOR}, https://evil.example`,
  ]) {
    it(`cors_refuses_other_origin ${origin}`, async () => {
      const response = await production(LIVE, { headers: { Origin: origin } });
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
      expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull();
      expect(response.headers.get('Vary')).toContain('Origin');

      const refused = await production(ECHO, preflight(origin));
      expect(refused.status).toBe(204);
      expect(refused.headers.get('Access-Control-Allow-Origin')).toBeNull();
      expect(refused.headers.get('Access-Control-Allow-Methods')).toBeNull();
      expect(refused.headers.get('Access-Control-Allow-Headers')).toBeNull();
    });
  }

  it('no_origin_header_gets_no_allow_origin', async () => {
    const response = await production(LIVE);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(response.headers.get('Vary')).toContain('Origin');
  });

  it('the_android_client_can_read_refusals_and_failures', async () => {
    const headers = { Origin: CAPACITOR };
    const user = appWith(signedIn);
    const responses = [
      await production('/api/v1/unknown', { headers }),
      await user.fetch(ECHO, { method: 'POST', headers, body: bytes(LIMIT + 1) }),
      await user.fetch(THROWS, { headers }),
      await user.fetch(THROWS_VALUE, { headers }),
      await appWith(undefined, { DB: env.DB }).fetch(LIVE, { headers }),
    ];
    for (const response of responses) {
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(CAPACITOR);
    }
  });

  it('preflight_allows_the_methods_and_headers_the_api_uses', async () => {
    const response = await production(
      ECHO,
      preflight(CAPACITOR, 'PATCH', 'authorization, content-type, x-client'),
    );
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(CAPACITOR);
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PATCH, DELETE');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
      'Authorization, Content-Type, X-Client',
    );
    expect(response.headers.get('Access-Control-Max-Age')).toBe('600');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull();
    expect(response.headers.get('Vary')).toContain('Origin');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(logEntries()).toHaveLength(1);
    expect(logEntries()[0]).toMatchObject({ method: 'OPTIONS', status: 204 });
  });

  for (const [label, init] of [
    ['a method the api does not use', preflight(CAPACITOR, 'PUT')],
    ['a lower-case method', preflight(CAPACITOR, 'post')],
    ['a header the api does not use', preflight(CAPACITOR, 'POST', 'authorization, x-evil')],
    ['the cookie header', preflight(CAPACITOR, 'POST', 'cookie')],
  ] as const) {
    it(`preflight_refuses ${label}`, async () => {
      const response = await production(ECHO, init);
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeNull();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeNull();
    });
  }

  it('a_preflight_never_runs_the_route_or_the_authenticator', async () => {
    const authenticate = vi.fn(signedIn);
    const { fetch, routeRuns } = appWith(authenticate);
    await fetch(ECHO, preflight(CAPACITOR));
    await fetch(ECHO, preflight('https://evil.example'));
    expect(routeRuns.count).toBe(0);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('options_that_is_not_a_preflight_is_denied', async () => {
    await expectProblem(await production(LIVE, { method: 'OPTIONS' }), 401, 'unauthenticated');
    const withOriginOnly = await production(LIVE, {
      method: 'OPTIONS',
      headers: { Origin: CAPACITOR },
    });
    await expectProblem(withOriginOnly, 401, 'unauthenticated');
  });

  it('paths_outside_api_get_no_cors', async () => {
    const response = await production('/not-api', { headers: { Origin: CAPACITOR } });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    const refused = await production('/not-api', preflight(CAPACITOR));
    await expectProblem(refused, 404, 'not_found');
    expect(refused.headers.get('Access-Control-Allow-Methods')).toBeNull();
  });
});

describe('body limit', () => {
  it('body_of_exactly_16KB_reaches_the_route_intact', async () => {
    const { fetch, routeRuns } = appWith(signedIn);
    const body = bytes(LIMIT);
    const response = await fetch(ECHO, { method: 'POST', body });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(body);
    expect(routeRuns.count).toBe(1);
  });

  it('body_of_16KB_plus_1_returns_413', async () => {
    const { fetch, routeRuns } = appWith(signedIn);
    const response = await fetch(ECHO, { method: 'POST', body: bytes(LIMIT + 1) });
    await expectProblem(response, 413, 'too_large');
    expect(routeRuns.count).toBe(0);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(logEntries()).toHaveLength(1);
    expect(logEntries()[0]).toMatchObject({
      level: 'info',
      status: 413,
      error_code: 'too_large',
      request_id: response.headers.get('X-Request-Id'),
    });
  });

  it('the_limit_counts_bytes_not_characters', async () => {
    const { fetch } = appWith(signedIn);
    const twoByteLetters = 'م'.repeat(LIMIT / 2);
    expect((await fetch(ECHO, { method: 'POST', body: twoByteLetters })).status).toBe(200);
    const oneOver = `${twoByteLetters}x`;
    await expectProblem(await fetch(ECHO, { method: 'POST', body: oneOver }), 413, 'too_large');
  });

  it('an_accepted_json_body_can_still_be_parsed', async () => {
    const response = await appWith(signedIn).fetch('/api/v1/test-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: 'غداء' }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ note: 'غداء' });
  });

  it('an_empty_body_passes', async () => {
    const response = await appWith(signedIn).fetch(ECHO, { method: 'POST' });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
  });

  it('a_declared_oversize_is_refused_without_reading_the_body', async () => {
    const { send, routeRuns } = appWith(signedIn);
    const { stream, progress } = countedStream(LIMIT + 1);
    const request = new Request(streamedPost(ECHO, stream), {
      headers: { 'Content-Length': String(LIMIT + 1) },
    });
    await expectProblem(await send(request), 413, 'too_large');
    expect(progress.pulls).toBe(0);
    expect(routeRuns.count).toBe(0);
  });

  it('a_false_small_content_length_does_not_pass_the_limit', async () => {
    const { send, routeRuns } = appWith(signedIn);
    const request = new Request(`${ORIGIN}${ECHO}`, {
      method: 'POST',
      headers: { 'Content-Length': '1' },
      body: bytes(LIMIT + 1),
    });
    expect(request.headers.get('Content-Length')).toBe('1');
    await expectProblem(await send(request), 413, 'too_large');
    expect(routeRuns.count).toBe(0);
  });

  it('a_false_content_length_is_corrected_for_the_route', async () => {
    const response = await appWith(signedIn).send(
      new Request(`${ORIGIN}${ECHO}`, {
        method: 'POST',
        headers: { 'Content-Length': '1' },
        body: bytes(100),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Seen-Content-Length')).toBe('100');
    expect((await response.arrayBuffer()).byteLength).toBe(100);
  });

  it('an_invalid_content_length_falls_back_to_counting', async () => {
    const { send } = appWith(signedIn);
    const request = new Request(`${ORIGIN}${ECHO}`, {
      method: 'POST',
      headers: { 'Content-Length': 'not-a-number' },
      body: bytes(LIMIT + 1),
    });
    await expectProblem(await send(request), 413, 'too_large');
  });

  it('a_stream_of_exactly_16KB_reaches_the_route', async () => {
    const { send } = appWith(signedIn);
    const { stream } = countedStream(LIMIT, 1000);
    const request = streamedPost(ECHO, stream);
    expect(request.headers.has('Content-Length')).toBe(false);
    const response = await send(request);
    expect(response.status).toBe(200);
    expect((await response.arrayBuffer()).byteLength).toBe(LIMIT);
  });

  it('a_stream_of_16KB_plus_1_returns_413', async () => {
    const { send, routeRuns } = appWith(signedIn);
    const { stream } = countedStream(LIMIT + 1, 1000);
    await expectProblem(await send(streamedPost(ECHO, stream)), 413, 'too_large');
    expect(routeRuns.count).toBe(0);
  });

  it('an_endless_stream_is_abandoned_at_the_limit', async () => {
    const { send } = appWith(signedIn);
    const { stream, progress } = countedStream(Number.MAX_SAFE_INTEGER, 1024);
    await expectProblem(await send(streamedPost(ECHO, stream)), 413, 'too_large');
    expect(progress.pulls).toBeLessThanOrEqual(LIMIT / 1024 + 2);
    await vi.waitFor(() => {
      expect(progress.cancelled).toBe(true);
    });
  });

  it('a_small_body_on_a_get_does_not_break_the_request', async () => {
    // A client on a raw socket can send this, but the Request constructor refuses to build one.
    const post = new Request(`${ORIGIN}${LIVE}`, { method: 'POST', body: 'x' });
    const getWithBody = new Proxy(post, {
      get(target, property) {
        if (property === 'method') return 'GET';
        const value: unknown = Reflect.get(target, property);
        return typeof value === 'function' ? (value.bind(target) as unknown) : value;
      },
    });
    expect((await appWith().send(getWithBody)).status).toBe(200);
  });

  it('a_body_that_fails_while_being_read_is_a_500', async () => {
    const { send, routeRuns } = appWith(signedIn);
    const stream: ReadableStream<Uint8Array> = new ReadableStream({
      type: 'bytes',
      pull() {
        throw new Error('connection lost');
      },
    });
    const response = await send(streamedPost(ECHO, stream));
    await expectProblem(response, 500, 'internal');
    expectSecurityHeaders(response, 'body read failure');
    expect(routeRuns.count).toBe(0);
  });
});

describe('order of checks', () => {
  it('an_anonymous_oversized_stream_gets_401_and_is_never_read', async () => {
    const { send, routeRuns } = appWith();
    for (const path of [ECHO, '/api/v1/unknown']) {
      const { stream, progress } = countedStream(LIMIT * 10);
      await expectProblem(await send(streamedPost(path, stream)), 401, 'unauthenticated');
      expect(progress.pulls).toBe(0);
    }
    expect(routeRuns.count).toBe(0);
  });

  it('an_anonymous_declared_oversize_gets_401_not_413', async () => {
    const response = await production('/api/v1/unknown', {
      method: 'POST',
      body: bytes(LIMIT + 1),
    });
    await expectProblem(response, 401, 'unauthenticated');
  });

  it('a_post_with_a_body_outside_api_gets_404_and_is_never_read', async () => {
    const { send } = appWith();
    const { stream, progress } = countedStream(LIMIT * 10);
    await expectProblem(await send(streamedPost('/not-api', stream)), 404, 'not_found');
    expect(progress.pulls).toBe(0);
  });

  it('a_signed_in_oversize_to_an_unknown_route_gets_413', async () => {
    const response = await appWith(signedIn).fetch('/api/v1/unknown', {
      method: 'POST',
      body: bytes(LIMIT + 1),
    });
    await expectProblem(response, 413, 'too_large');
  });
});

describe('default deny', () => {
  it('public_routes_are_exactly_the_health_endpoints_and_config', () => {
    expect(PUBLIC_ROUTES).toEqual([
      { method: 'GET', path: LIVE },
      { method: 'GET', path: READY },
      { method: 'GET', path: '/api/v1/config' },
    ]);
  });

  it('every_public_route_answers_without_a_session', async () => {
    for (const { path } of PUBLIC_ROUTES) {
      expect((await production(path)).status, path).toBe(200);
      expect((await production(`${path}?x=1`)).status, path).toBe(200);
      expect((await production(path, { method: 'HEAD' })).status, path).toBe(200);
    }
  });

  it('public_routes_do_not_consult_the_authenticator', async () => {
    const authenticate = vi.fn<Authenticator>(() => Promise.reject(new Error('down')));
    expect((await appWith(authenticate).fetch(LIVE)).status).toBe(200);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('undeclared_route_returns_401_without_session', async () => {
    const response = await production('/api/v1/users/someone?note=lunch');
    await expectProblem(response, 401, 'unauthenticated');
    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(logEntries()).toHaveLength(1);
    expect(logEntries()[0]).toMatchObject({
      level: 'info',
      route: 'unmatched',
      status: 401,
      error_code: 'unauthenticated',
    });
    expect(JSON.stringify(logEntries())).not.toContain('someone');
    expect(JSON.stringify(logEntries())).not.toContain('lunch');
  });

  it('a_declared_route_returns_401_without_session_and_does_not_run', async () => {
    const { fetch, routeRuns } = appWith();
    await expectProblem(await fetch(ECHO, { method: 'POST', body: 'x' }), 401, 'unauthenticated');
    expect(routeRuns.count).toBe(0);
  });

  it('declared_and_undeclared_routes_look_the_same_to_an_anonymous_caller', async () => {
    const { fetch } = appWith();
    const declared = await (await fetch(ECHO, { method: 'POST' })).json<Record<string, unknown>>();
    const unknown = await (
      await fetch('/api/v1/nothing', { method: 'POST' })
    ).json<Record<string, unknown>>();
    expect({ ...declared, request_id: '' }).toEqual({ ...unknown, request_id: '' });
  });

  it('the_api_root_is_denied', async () => {
    for (const path of ['/api', '/api/', '/api/v1', '/api/v1/', '/api/v1/health']) {
      await expectProblem(await production(path), 401, 'unauthenticated');
    }
  });

  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    it(`${method}_on_a_public_path_is_not_public`, async () => {
      for (const path of [LIVE, READY]) {
        await expectProblem(await production(path, { method }), 401, 'unauthenticated');
      }
    });
  }

  for (const path of [
    `${LIVE}/`,
    `${READY}/`,
    `${LIVE}//`,
    '/api/v1/health/LIVE',
    '/api/V1/health/live',
    '/API/v1/health/live',
    '/Api/v1/health/ready',
    '/api/v1/health/%6Cive',
    '/api/v1/health/%6cive',
    '/api/v1/%68ealth/live',
    '/%61pi/v1/health/live',
    '/api/v1/health%2Flive',
    '/api/v1/health/live%2F',
    '/api/v1/health/live%20',
    '/api/v1/health/live%00',
    '/api/v1/health/live%3F',
    '/api/v1/health/live%23',
    '/api/v1/health/live;x=1',
    '/api/v1/health/%256Cive',
    '//api/v1/health/live',
    '///api/v1/health/live',
    '/api//v1/health/live',
    '/api/v1//health/live',
    '/api/v1/health//live',
    '/api/v1/health/live/extra',
    '/api/v1/health/livex',
    '/api/v1/health/../me',
    // An encoded slash after `api` was a 404 outside the API until T-017; it must never reach the
    // web build, so it is now treated as an API path.
    '/api%2Fv1/health/live',
    '/api%2fv1/health/live',
  ]) {
    it(`path_trick_is_denied ${path}`, async () => {
      const response = await production(path);
      await expectProblem(response, 401, 'unauthenticated');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });
  }

  it('a_declared_route_cannot_be_reached_through_an_encoded_path', async () => {
    const { fetch, routeRuns } = appWith();
    for (const path of ['/api/v1/test-%65cho', '/%61pi/v1/test-echo']) {
      await expectProblem(await fetch(path, { method: 'POST' }), 401, 'unauthenticated');
    }
    expect(routeRuns.count).toBe(0);
  });

  // Since T-017 a GET or HEAD outside /api is a public page of the web build (assets.test.ts).
  // Every other method there is still denied, before any body is read.
  it('paths_outside_api_are_problem_json_404', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      for (const path of ['/', '/not-api', '/apiary']) {
        const response = await production(path, { method });
        await expectProblem(response, 404, 'not_found');
        expect(response.headers.get('Cache-Control')).toBeNull();
        expect(response.headers.get('Vary')).toBeNull();
      }
    }
  });
});

describe('session seam', () => {
  for (const [name, value] of [
    ['Authorization', 'Bearer anything'],
    ['Cookie', '__Secure-better-auth.session_token=anything'],
    ['X-User-Id', 'someone'],
    ['X-Session', 'true'],
    ['X-Authenticated', 'true'],
    ['X-Forwarded-User', 'someone'],
    ['CF-Access-Authenticated-User-Email', 'someone@example.com'],
  ] as const) {
    it(`the_header_${name}_does_not_create_a_session`, async () => {
      const response = await production('/api/v1/unknown', { headers: { [name]: value } });
      await expectProblem(response, 401, 'unauthenticated');
    });
  }

  it('a_query_parameter_does_not_create_a_session', async () => {
    const response = await production('/api/v1/unknown?session=1&token=x&authenticated=true');
    await expectProblem(response, 401, 'unauthenticated');
  });

  it('an_authenticator_that_finds_a_session_lets_the_request_through', async () => {
    const { fetch, routeRuns } = appWith(signedIn);
    expect((await fetch(ECHO, { method: 'POST', body: 'x' })).status).toBe(200);
    expect(routeRuns.count).toBe(1);
  });

  it('a_signed_in_caller_gets_404_for_an_unknown_route', async () => {
    await expectProblem(await appWith(signedIn).fetch('/api/v1/unknown'), 404, 'not_found');
  });

  it('an_authenticator_returning_null_is_refused', async () => {
    const { fetch } = appWith(() => Promise.resolve(null));
    await expectProblem(await fetch('/api/v1/unknown'), 401, 'unauthenticated');
  });

  it('a_failing_authenticator_fails_closed', async () => {
    const { fetch, routeRuns } = appWith(() => Promise.reject(new Error('session store down')));
    const response = await fetch(ECHO, { method: 'POST', body: 'x' });
    await expectProblem(response, 500, 'internal');
    expect(routeRuns.count).toBe(0);
  });
});
