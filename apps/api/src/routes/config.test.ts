import { env, exports } from 'cloudflare:workers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../app.js';
import { createWorkersPlatform } from '../platform.js';
import type { WorkerBindings } from '../platform.js';
import { POLICY_VERSIONS } from '../policies.js';
import type { Authenticator } from '../session.js';

const ORIGIN = 'https://api.example.test';
const CONFIG = '/api/v1/config';
// Shaped like a Google web client id; not a real one.
const CLIENT_ID = '000000000000-testclientidplaceholder0000000.apps.googleusercontent.com';
// Stands in for a Worker secret binding; it must never appear in a response or a log line.
const PRIVATE_MARKER = 'private-marker-that-must-never-be-served';

const logSpy = vi.spyOn(console, 'log');

beforeEach(() => {
  logSpy.mockReset();
  logSpy.mockImplementation(() => undefined);
});

function firstLogEntry(): Record<string, unknown> {
  return JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? '{}')) as Record<string, unknown>;
}

function production(path: string, init?: RequestInit): Promise<Response> {
  return exports.default.fetch(`${ORIGIN}${path}`, init);
}

/** The real application over chosen bindings, with an authenticator the test can watch. */
function fetchWith(
  bindings: WorkerBindings & Record<string, unknown>,
  authenticate: Authenticator = () => Promise.resolve(null),
  init?: RequestInit,
): Promise<Response> {
  const app = createApp(createWorkersPlatform, authenticate);
  return Promise.resolve(app.fetch(new Request(`${ORIGIN}${CONFIG}`, init), bindings));
}

describe('GET /api/v1/config', () => {
  it('config_returns_public_values_only', async () => {
    const response = await fetchWith({
      DB: env.DB,
      RELEASE: 'abc123',
      GOOGLE_CLIENT_ID: CLIENT_ID,
      BETTER_AUTH_SECRET: PRIVATE_MARKER,
      HMAC_KEY: PRIVATE_MARKER,
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toMatch(/^application\/json/);
    const text = await response.clone().text();
    const body = await response.json<Record<string, unknown>>();

    expect(Object.keys(body).sort()).toEqual([
      'googleClientId',
      'privacyVersion',
      'release',
      'termsVersion',
    ]);
    expect(body).toEqual({
      googleClientId: CLIENT_ID,
      termsVersion: POLICY_VERSIONS.terms,
      privacyVersion: POLICY_VERSIONS.privacy,
      release: 'abc123',
    });
    expect(text).not.toContain(PRIVATE_MARKER);
  });

  it('google_client_id_is_null_when_not_configured', async () => {
    const response = await production(CONFIG);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      googleClientId: null,
      termsVersion: POLICY_VERSIONS.terms,
      privacyVersion: POLICY_VERSIONS.privacy,
      release: 'test-release',
    });
  });

  it('an_empty_google_client_id_counts_as_not_configured', async () => {
    const response = await fetchWith({ DB: env.DB, RELEASE: 'r1', GOOGLE_CLIENT_ID: '  ' });
    expect(await response.json()).toMatchObject({ googleClientId: null });
  });

  it('a_value_that_is_not_a_google_client_id_refuses_the_request_and_names_the_variable', async () => {
    const response = await fetchWith({
      DB: env.DB,
      RELEASE: 'r1',
      GOOGLE_CLIENT_ID: PRIVATE_MARKER,
    });
    const text = await response.text();
    expect(response.status).toBe(500);
    expect(text).not.toContain(PRIVATE_MARKER);
    expect(text).not.toContain('GOOGLE_CLIENT_ID');
    expect(firstLogEntry()).toMatchObject({
      level: 'error',
      error_code: 'configuration_missing',
      missing_variables: ['GOOGLE_CLIENT_ID'],
    });
    expect(String(logSpy.mock.calls[0]?.[0])).not.toContain(PRIVATE_MARKER);
  });

  it('answers_without_a_session_and_without_asking_the_authenticator', async () => {
    const authenticate = vi.fn<Authenticator>(() => Promise.reject(new Error('down')));
    const response = await fetchWith({ DB: env.DB, RELEASE: 'r1' }, authenticate);
    expect(response.status).toBe(200);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('head_follows_the_public_get', async () => {
    const response = await production(CONFIG, { method: 'HEAD' });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
  });

  it('a_post_is_not_public', async () => {
    const response = await production(CONFIG, { method: 'POST' });
    expect(response.status).toBe(401);
  });

  it('is_no_store_with_the_security_headers_and_a_request_id', async () => {
    const response = await production(CONFIG);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Request-Id')).not.toBeNull();
    expect(response.headers.get('Strict-Transport-Security')).toBe(
      'max-age=31536000; includeSubDomains',
    );
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
  });

  it('the_android_origin_can_read_it', async () => {
    const response = await production(CONFIG, { headers: { Origin: 'https://localhost' } });
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://localhost');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBeNull();
  });

  it('another_origin_gets_no_cors_permission', async () => {
    const response = await production(CONFIG, { headers: { Origin: 'https://evil.example' } });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('the_android_preflight_with_x_client_is_allowed', async () => {
    const response = await production(CONFIG, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://localhost',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'x-client',
      },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('X-Client');
  });

  it('the_policy_versions_are_non_empty', () => {
    expect(POLICY_VERSIONS.terms).not.toBe('');
    expect(POLICY_VERSIONS.privacy).not.toBe('');
  });
});
