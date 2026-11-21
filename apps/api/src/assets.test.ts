import { env, exports } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { createWorkersPlatform } from './platform.js';

// The deployed entry point with the real static-assets binding, configured as in wrangler.jsonc
// (run_worker_first, single-page-application fallback) over a small stand-in for the web build in
// apps/api/test-assets (see vitest.config.ts).
const ORIGIN = 'https://app.example.test';
const INDEX_MARKER = 'test-assets index';
const SCRIPT_MARKER = 'test-assets script';
const CAPACITOR = 'https://localhost';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** NFR-020, architecture "Transport and headers": the same values the API responses carry. */
const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'microphone=(), camera=(), geolocation=()',
  'Content-Security-Policy': [
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
  ].join('; '),
};

/** What a browser sends when the address bar or a link opens a page. */
const NAVIGATION = {
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Dest': 'document',
  Accept: 'text/html,application/xhtml+xml',
};

const logSpy = vi.spyOn(console, 'log');

beforeEach(() => {
  logSpy.mockReset();
  logSpy.mockImplementation(() => undefined);
});

afterEach(() => {
  logSpy.mockReset();
});

function production(path: string, init?: RequestInit): Promise<Response> {
  return exports.default.fetch(`${ORIGIN}${path}`, init);
}

function expectSecurityHeaders(response: Response, label: string): void {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    expect(response.headers.get(name), `${name} on ${label}`).toBe(value);
  }
  expect(response.headers.get('X-Request-Id'), label).toMatch(UUID);
}

async function expectIndexHtml(response: Response, label: string): Promise<void> {
  expect(response.status, label).toBe(200);
  expect(response.headers.get('Content-Type'), label).toMatch(/^text\/html/);
  expect(await response.text(), label).toContain(INDEX_MARKER);
}

async function expectProblem(response: Response, status: number, code: string, label: string) {
  expect(response.status, label).toBe(status);
  expect(response.headers.get('Content-Type'), label).toBe('application/problem+json');
  const body = await response.text();
  expect(body, label).not.toContain(INDEX_MARKER);
  expect(JSON.parse(body), label).toMatchObject({ status, code });
}

describe('the web build is served by the Worker on the same origin', () => {
  it('the_root_serves_index_html_with_the_security_headers', async () => {
    for (const headers of [NAVIGATION, {}]) {
      const response = await production('/', { headers });
      expectSecurityHeaders(response, '/');
      await expectIndexHtml(response, '/');
    }
  });

  it('an_asset_file_is_served_with_the_security_headers', async () => {
    const response = await production('/assets/app.js');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toMatch(/javascript/);
    expect(await response.text()).toContain(SCRIPT_MARKER);
    expectSecurityHeaders(response, '/assets/app.js');
  });

  it('spa_routes_fall_back_to_index_html', async () => {
    for (const path of ['/sign-in', '/expenses/new', '/expenses/42', '/no-such-page', '/apiary']) {
      for (const headers of [NAVIGATION, {}]) {
        const response = await production(path, { headers });
        expectSecurityHeaders(response, path);
        await expectIndexHtml(response, path);
      }
    }
  });

  it('head_on_a_page_carries_the_headers_and_no_body', async () => {
    const response = await production('/expenses', { method: 'HEAD', headers: NAVIGATION });
    expect(response.status).toBe(200);
    expectSecurityHeaders(response, 'HEAD /expenses');
    expect(await response.text()).toBe('');
  });

  it('a_revalidated_page_still_carries_the_headers', async () => {
    const first = await production('/');
    await first.arrayBuffer();
    const etag = first.headers.get('ETag');
    expect(etag).not.toBeNull();
    const response = await production('/', { headers: { 'If-None-Match': etag ?? '' } });
    expect(response.status).toBe(304);
    expectSecurityHeaders(response, '304');
  });

  it('pages_are_not_marked_no_store_and_get_no_cors', async () => {
    const response = await production('/', { headers: { Origin: CAPACITOR } });
    await response.arrayBuffer();
    expect(response.headers.get('Cache-Control')).not.toBe('no-store');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('every_page_request_is_logged_without_its_path', async () => {
    await (await production('/expenses/secret-looking-id?email=a@example.com')).arrayBuffer();
    const lines = logSpy.mock.calls.map((call) => String(call[0]));
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toContain('secret-looking-id');
    expect(lines[0]).not.toContain('example.com');
    expect(JSON.parse(lines[0] ?? '{}')).toMatchObject({ route: 'static', status: 200 });
  });
});

describe('/api is never answered by index.html', () => {
  const unknownApiPaths = [
    '/api',
    '/api/',
    '/api/v1',
    '/api/v1/unknown',
    '/api/v2/config',
    '/API/v1/unknown',
    '//api/v1/unknown',
    '/%61pi/v1/unknown',
    '/api%2Fv1/health/live',
    '/api%2fv1/unknown',
  ];

  for (const path of unknownApiPaths) {
    it(`unknown_api_path_goes_through_access_control ${path}`, async () => {
      for (const headers of [NAVIGATION, {}]) {
        const response = await production(path, { headers });
        expectSecurityHeaders(response, path);
        expect(response.headers.get('Cache-Control'), path).toBe('no-store');
        await expectProblem(response, 401, 'unauthenticated', path);
      }
    });
  }

  it('a_public_api_route_still_answers_json', async () => {
    const response = await production('/api/v1/config', { headers: NAVIGATION });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toMatch(/^application\/json/);
  });

  it('a_signed_in_unknown_api_path_is_404_problem_not_a_page', async () => {
    const app = createApp(createWorkersPlatform, () => Promise.resolve({ userId: 'test-user' }));
    const response = await app.fetch(
      new Request(`${ORIGIN}/api/v1/unknown`, { headers: NAVIGATION }),
      {
        DB: env.DB,
        RELEASE: 'r1',
        ASSETS: env.ASSETS,
      },
    );
    await expectProblem(response, 404, 'not_found', 'signed in');
  });
});

describe('only GET and HEAD reach the web build', () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    it(`${method}_outside_api_is_a_404_problem`, async () => {
      for (const path of ['/', '/expenses/new', '/assets/app.js']) {
        const response = await production(path, { method });
        expectSecurityHeaders(response, `${method} ${path}`);
        await expectProblem(response, 404, 'not_found', `${method} ${path}`);
      }
    });
  }
});

describe('without the assets binding', () => {
  it('a_page_request_is_a_404_problem', async () => {
    const app = createApp(createWorkersPlatform);
    const response = await app.fetch(new Request(`${ORIGIN}/expenses`), {
      DB: env.DB,
      RELEASE: 'r1',
    });
    expectSecurityHeaders(response, 'no assets');
    await expectProblem(response, 404, 'not_found', 'no assets');
  });

  it('a_failing_assets_binding_is_a_500_problem_with_the_headers', async () => {
    const app = createApp(createWorkersPlatform);
    const broken = { fetch: () => Promise.reject(new Error('assets down')) } as unknown as Fetcher;
    const response = await app.fetch(new Request(`${ORIGIN}/`), {
      DB: env.DB,
      RELEASE: 'r1',
      ASSETS: broken,
    });
    expectSecurityHeaders(response, 'broken assets');
    await expectProblem(response, 500, 'internal', 'broken assets');
  });
});
