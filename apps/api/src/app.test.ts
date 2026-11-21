import { env, exports } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { createWorkersPlatform } from './platform.js';
import type { Deadline, WorkerBindings } from './platform.js';

const ORIGIN = 'https://api.example.test';
const LIVE = '/api/v1/health/live';
const READY = '/api/v1/health/ready';
const THROWS = '/api/v1/test-throw';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EMAIL = 'seeded.marker@example.com';

interface Problem {
  type: string;
  title: string;
  status: number;
  code: string;
  request_id: string;
}

/** A clock the test advances by hand, so the 2-second limit is exercised without waiting. */
class ManualClock {
  private time = 0;
  private readonly waiting = new Set<{ at: number; fire: () => void }>();
  cancelled = 0;

  startDeadline(milliseconds: number): Deadline {
    const entry = { at: this.time + milliseconds, fire: () => undefined as void };
    const expired = new Promise<void>((resolve) => {
      entry.fire = resolve;
    });
    this.waiting.add(entry);
    return {
      expired,
      cancel: () => {
        this.cancelled += 1;
        this.waiting.delete(entry);
      },
    };
  }

  advance(milliseconds: number): void {
    this.time += milliseconds;
    for (const entry of this.waiting) {
      if (entry.at <= this.time) {
        this.waiting.delete(entry);
        entry.fire();
      }
    }
  }
}

const logSpy = vi.spyOn(console, 'log');

beforeEach(() => {
  logSpy.mockReset();
  logSpy.mockImplementation(() => undefined);
});

afterEach(() => {
  logSpy.mockReset();
});

function logLines(): string[] {
  return logSpy.mock.calls.map((call) => String(call[0]));
}

function firstLogEntry(): Record<string, unknown> {
  return JSON.parse(logLines()[0] ?? '{}') as Record<string, unknown>;
}

function get(path: string, init?: RequestInit): Promise<Response> {
  return exports.default.fetch(`${ORIGIN}${path}`, init);
}

/** The real application and the real adapter, over the given bindings. */
function appWith(bindings: WorkerBindings, clock?: ManualClock) {
  const overrides = clock ? { startDeadline: (ms: number) => clock.startDeadline(ms) } : {};
  // Signed in, so that test routes are reachable behind the default-deny layer (T-015).
  const app = createApp(
    (current) => createWorkersPlatform(current, overrides),
    () => Promise.resolve({ userId: 'test-user' }),
  );
  app.get(THROWS, () => {
    throw new Error(`internal detail for ${EMAIL}`);
  });
  return {
    app,
    fetch: async (path: string) => app.fetch(new Request(`${ORIGIN}${path}`), bindings),
  };
}

/** A real D1 failure: every statement is replaced by a query on a table that does not exist. */
function failingDatabase(): D1Database {
  return {
    prepare: () => env.DB.prepare('SELECT * FROM table_that_does_not_exist'),
  } as unknown as D1Database;
}

function hangingDatabase(): D1Database {
  const never = () => new Promise<never>(() => undefined);
  const statement = { bind: () => statement, raw: never, all: never, first: never, run: never };
  return { prepare: () => statement } as unknown as D1Database;
}

async function settle(): Promise<void> {
  for (let turn = 0; turn < 5; turn += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

async function expectProblem(response: Response, status: number, code: string): Promise<Problem> {
  expect(response.status).toBe(status);
  expect(response.headers.get('Content-Type')).toBe('application/problem+json');
  const body = await response.json<Problem>();
  expect(body).toMatchObject({ type: 'about:blank', status, code });
  expect(body.title).not.toBe('');
  expect(body.request_id).toBe(response.headers.get('X-Request-Id'));
  expect(Object.keys(body).sort()).toEqual(['code', 'request_id', 'status', 'title', 'type']);
  return body;
}

describe('health', () => {
  it('live_returns_200', async () => {
    const response = await get(LIVE);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('ready_returns_200_with_database', async () => {
    const response = await get(READY);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('ready_cancels_its_deadline_after_the_database_answers', async () => {
    const clock = new ManualClock();
    const response = await appWith({ DB: env.DB, RELEASE: 'r1' }, clock).fetch(READY);
    expect(response.status).toBe(200);
    expect(clock.cancelled).toBe(1);
  });

  it('ready_returns_503_when_database_fails', async () => {
    const response = await appWith({ DB: failingDatabase(), RELEASE: 'r1' }).fetch(READY);
    const text = await response.clone().text();
    await expectProblem(response, 503, 'not_ready');
    expect(text).not.toContain('table_that_does_not_exist');
    expect(firstLogEntry()).toMatchObject({
      level: 'error',
      status: 503,
      error_code: 'database_unavailable',
    });
    expect(logLines().join('\n')).not.toContain('table_that_does_not_exist');
  });

  it('ready_returns_503_when_database_hangs_for_2_seconds', async () => {
    const clock = new ManualClock();
    const { fetch } = appWith({ DB: hangingDatabase(), RELEASE: 'r1' }, clock);
    let settled = false;
    const pending = fetch(READY).then((response) => {
      settled = true;
      return response;
    });

    await settle();
    clock.advance(1999);
    await settle();
    expect(settled).toBe(false);

    clock.advance(1);
    await expectProblem(await pending, 503, 'not_ready');
    expect(firstLogEntry()).toMatchObject({ status: 503, error_code: 'database_timeout' });
  });
});

describe('platform adapter', () => {
  it('real_deadline_expires', async () => {
    const deadline = createWorkersPlatform({}).startDeadline(1);
    await expect(deadline.expired).resolves.toBeUndefined();
    deadline.cancel();
  });
});

describe('request id', () => {
  it('every_response_has_request_id', async () => {
    const { fetch } = appWith({ DB: failingDatabase(), RELEASE: 'r1' });
    const responses = [
      await get(LIVE),
      await get(READY),
      await get('/api/v1/unknown'),
      await get('/not-api'),
      await fetch(READY),
      await fetch(THROWS),
      await appWith({}).fetch(LIVE),
    ];
    const ids = responses.map((response) => response.headers.get('X-Request-Id') ?? '');
    for (const id of ids) expect(id).toMatch(UUID);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ignores_an_inbound_request_id', async () => {
    const response = await get(LIVE, { headers: { 'X-Request-Id': 'client-chosen' } });
    expect(response.headers.get('X-Request-Id')).toMatch(UUID);
    expect(logLines().join('\n')).not.toContain('client-chosen');
  });
});

describe('errors', () => {
  it('unhandled_error_returns_problem_json_without_stack', async () => {
    const response = await appWith({ DB: env.DB, RELEASE: 'r1' }).fetch(THROWS);
    const text = await response.clone().text();
    const body = await expectProblem(response, 500, 'internal');

    expect(text).not.toContain('internal detail');
    expect(text).not.toContain(EMAIL);
    expect(text).not.toMatch(/\bat .+:\d+:\d+/);

    expect(firstLogEntry()).toMatchObject({
      level: 'error',
      request_id: body.request_id,
      route: THROWS,
      status: 500,
      error_code: 'internal',
      release: 'r1',
      stack: expect.stringMatching(/^at /) as string,
    });
    expect(logLines().join('\n')).not.toContain(EMAIL);
  });

  it('survives_a_thrown_value_that_is_not_an_error', async () => {
    const { app, fetch } = appWith({ DB: env.DB, RELEASE: 'r1' });
    app.get('/api/v1/test-throw-string', () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- the case under test
      throw EMAIL;
    });
    await expectProblem(await fetch('/api/v1/test-throw-string'), 500, 'internal');
    expect(logLines().join('\n')).not.toContain(EMAIL);
  });

  // Default deny (T-015): without a session an unknown route is 401, so that an anonymous caller
  // cannot tell which routes exist. A signed-in caller still gets the 404.
  it('unknown_api_route_returns_problem_json', async () => {
    const path = `/api/v1/users/${EMAIL}?note=lunch`;
    await expectProblem(await get(path), 401, 'unauthenticated');
    await expectProblem(await appWith({ DB: env.DB, RELEASE: 'r1' }).fetch(path), 404, 'not_found');
    expect(logLines()).toHaveLength(2);
    expect(JSON.parse(logLines()[1] ?? '{}')).toMatchObject({
      route: 'unmatched',
      status: 404,
      level: 'info',
    });
    expect(logLines().join('\n')).not.toContain(EMAIL);
    expect(logLines().join('\n')).not.toContain('lunch');
  });

  it('wrong_method_on_a_known_path_returns_problem_json', async () => {
    await expectProblem(await get(LIVE, { method: 'POST' }), 401, 'unauthenticated');
    const { app } = appWith({ DB: env.DB, RELEASE: 'r1' });
    const signedIn = await app.fetch(new Request(`${ORIGIN}${LIVE}`, { method: 'POST' }), {
      DB: env.DB,
      RELEASE: 'r1',
    });
    await expectProblem(signedIn, 404, 'not_found');
  });

  // Since T-017 a GET outside /api is a page of the web build (assets.test.ts); any other method
  // there is still refused with problem details.
  it('a_path_outside_the_api_returns_problem_json', async () => {
    await expectProblem(await get('/not-api', { method: 'POST' }), 404, 'not_found');
    await expectProblem(await get('/not-api', { method: 'DELETE' }), 404, 'not_found');
  });

  it('a_page_request_without_a_web_build_returns_problem_json', async () => {
    await expectProblem(
      await appWith({ DB: env.DB, RELEASE: 'r1' }).fetch('/not-api'),
      404,
      'not_found',
    );
  });

  it('missing_variable_refuses_the_request_and_logs_the_name_only', async () => {
    const response = await appWith({ DB: env.DB }).fetch(LIVE);
    const text = await response.clone().text();
    await expectProblem(response, 500, 'internal');
    expect(text).not.toContain('RELEASE');
    expect(firstLogEntry()).toMatchObject({
      level: 'error',
      status: 500,
      error_code: 'configuration_missing',
      missing_variables: ['RELEASE'],
    });
  });
});

describe('response headers', () => {
  it('api_responses_are_no_store', async () => {
    const { fetch } = appWith({ DB: failingDatabase(), RELEASE: 'r1' });
    const responses = [
      await get(LIVE),
      await get(READY),
      await get('/api/v1/unknown'),
      await get('/api'),
      await fetch(READY),
      await fetch(THROWS),
      await appWith({}).fetch(LIVE),
    ];
    for (const response of responses) {
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    }
  });

  it('paths_outside_api_are_not_marked_no_store', async () => {
    // A page keeps the caching the static-assets service gives it; a refusal there sets none.
    const page = await get('/apiary');
    expect(page.status).toBe(200);
    expect(page.headers.get('Cache-Control')).not.toBe('no-store');
    const refused = await get('/apiary', { method: 'POST' });
    expect(refused.headers.get('Cache-Control')).toBeNull();
  });
});

describe('request log', () => {
  it('writes_one_allow_listed_line_per_request', async () => {
    const response = await get(`${LIVE}?email=${EMAIL}`, {
      headers: { 'X-Client': 'android/1.4.0', 'CF-Connecting-IP': '203.0.113.9' },
    });
    expect(logLines()).toHaveLength(1);
    const entry = firstLogEntry();
    expect(Object.keys(entry).sort()).toEqual([
      'client',
      'duration_ms',
      'level',
      'method',
      'release',
      'request_id',
      'route',
      'status',
      'ts',
    ]);
    expect(entry).toMatchObject({
      level: 'info',
      request_id: response.headers.get('X-Request-Id'),
      method: 'GET',
      route: LIVE,
      status: 200,
      release: 'test-release',
      client: 'android/1.4.0',
    });
    expect(logLines()[0]).not.toContain(EMAIL);
    expect(logLines()[0]).not.toContain('203.0.113.9');
  });

  it('an_unrecognised_client_header_is_logged_as_web', async () => {
    await get(LIVE, { headers: { 'X-Client': EMAIL } });
    expect(firstLogEntry()).toMatchObject({ client: 'web' });
    expect(logLines()[0]).not.toContain(EMAIL);
  });
});
