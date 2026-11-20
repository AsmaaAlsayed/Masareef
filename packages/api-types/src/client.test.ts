import { describe, expect, expectTypeOf, it } from 'vitest';
import { ApiError, buildRequestUrl, createApiClient } from './client.js';
import type { ApiErrorCode, PublicConfig, RequestOptions, SuccessBody } from './client.js';

interface Call {
  readonly url: string;
  readonly init: RequestInit;
}

const CONFIG: PublicConfig = {
  googleClientId: null,
  termsVersion: '1',
  privacyVersion: '1',
  release: 'abc123',
};

/** A fetch that records each call and answers with the next queued response. */
function fakeFetch(...responses: (Response | Error)[]) {
  const calls: Call[] = [];
  const fetch = (input: string, init: RequestInit = {}): Promise<Response> => {
    calls.push({ url: input, init });
    const next = responses.shift();
    if (next === undefined) return Promise.reject(new Error('no response queued'));
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  };
  return { calls, fetch };
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function problem(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify({ type: 'about:blank', status, ...body }), {
    status,
    headers: { 'Content-Type': 'application/problem+json', 'X-Request-Id': 'header-id' },
  });
}

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('the call succeeded');
}

function headersOf(call: Call | undefined): Headers {
  return new Headers(call?.init.headers);
}

describe('getConfig', () => {
  it('returns_the_typed_configuration', async () => {
    const { calls, fetch } = fakeFetch(json(CONFIG));
    const config = await createApiClient({ fetch }).getConfig();
    expect(config).toEqual(CONFIG);
    expectTypeOf(config).toEqualTypeOf<PublicConfig>();
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe('/api/v1/config');
    expect(calls[0]?.init.method).toBe('GET');
    expect(headersOf(calls[0]).get('Accept')).toBe('application/json');
  });

  it('joins_the_base_url_without_doubling_the_slash', async () => {
    const { calls, fetch } = fakeFetch(json(CONFIG));
    await createApiClient({ fetch, baseUrl: 'https://staging.example.test/' }).getConfig();
    expect(calls[0]?.url).toBe('https://staging.example.test/api/v1/config');
  });

  it('sends_x_client_when_configured', async () => {
    const { calls, fetch } = fakeFetch(json(CONFIG));
    await createApiClient({ fetch, client: 'android/1.4.0' }).getConfig();
    expect(headersOf(calls[0]).get('X-Client')).toBe('android/1.4.0');
  });

  it('sends_no_x_client_and_no_credentials_header_on_the_web', async () => {
    const { calls, fetch } = fakeFetch(json(CONFIG));
    await createApiClient({ fetch }).getConfig();
    expect(headersOf(calls[0]).has('X-Client')).toBe(false);
    expect(headersOf(calls[0]).has('Authorization')).toBe(false);
    expect(calls[0]?.init.body).toBeUndefined();
  });

  it('passes_the_abort_signal', async () => {
    const { calls, fetch } = fakeFetch(json(CONFIG));
    const controller = new AbortController();
    await createApiClient({ fetch }).getConfig({ signal: controller.signal });
    expect(calls[0]?.init.signal).toBe(controller.signal);
  });
});

describe('errors', () => {
  it('problem_json_becomes_a_typed_api_error', async () => {
    const { fetch } = fakeFetch(
      problem(
        {
          title: 'Bad Request',
          code: 'validation_failed',
          request_id: 'body-id',
          errors: [{ field: 'limit', code: 'too_big' }],
        },
        400,
      ),
    );
    const error = await rejection(createApiClient({ fetch }).request('get', '/api/v1/config'));
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(400);
    expect(error.code).toBe('validation_failed');
    expect(error.requestId).toBe('body-id');
    expect(error.errors).toEqual([{ field: 'limit', code: 'too_big' }]);
    expectTypeOf(error.code).toEqualTypeOf<ApiErrorCode>();
  });

  it('a_503_problem_keeps_its_code', async () => {
    const { fetch } = fakeFetch(problem({ code: 'not_ready', request_id: 'r' }, 503));
    const error = await rejection(
      createApiClient({ fetch }).request('get', '/api/v1/health/ready'),
    );
    expect(error).toMatchObject({ status: 503, code: 'not_ready', requestId: 'r', errors: [] });
  });

  it('an_error_without_problem_json_is_unexpected_response_with_the_header_id', async () => {
    const { fetch } = fakeFetch(
      new Response('<html>Bad gateway</html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html', 'X-Request-Id': 'header-id' },
      }),
    );
    const error = await rejection(createApiClient({ fetch }).getConfig());
    expect(error).toMatchObject({
      status: 502,
      code: 'unexpected_response',
      requestId: 'header-id',
    });
  });

  it('a_problem_body_that_is_not_json_is_unexpected_response', async () => {
    const { fetch } = fakeFetch(
      new Response('not json', {
        status: 500,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );
    const error = await rejection(createApiClient({ fetch }).getConfig());
    expect(error).toMatchObject({ status: 500, code: 'unexpected_response', requestId: undefined });
  });

  it('a_problem_without_a_code_is_unexpected_response', async () => {
    const { fetch } = fakeFetch(problem({ title: 'x' }, 500));
    const error = await rejection(createApiClient({ fetch }).getConfig());
    expect(error).toMatchObject({
      status: 500,
      code: 'unexpected_response',
      requestId: 'header-id',
    });
  });

  it('malformed_field_errors_are_dropped', async () => {
    const { fetch } = fakeFetch(
      problem(
        { code: 'validation_failed', errors: [{ field: 1 }, 'x', { field: 'a', code: 'b' }] },
        400,
      ),
    );
    const error = await rejection(createApiClient({ fetch }).getConfig());
    expect(error.errors).toEqual([{ field: 'a', code: 'b' }]);
  });

  it('a_success_body_that_is_not_json_is_unexpected_response', async () => {
    const { fetch } = fakeFetch(new Response('not json', { status: 200 }));
    const error = await rejection(createApiClient({ fetch }).getConfig());
    expect(error).toMatchObject({ status: 200, code: 'unexpected_response' });
  });

  it('a_network_failure_is_network_error', async () => {
    const { fetch } = fakeFetch(new TypeError('Failed to fetch'));
    const error = await rejection(createApiClient({ fetch }).getConfig());
    expect(error).toMatchObject({ status: 0, code: 'network_error', requestId: undefined });
    expect(error.cause).toBeInstanceOf(TypeError);
  });

  it('an_abort_is_passed_through_unchanged', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError');
    const { fetch } = fakeFetch(abort);
    await expect(createApiClient({ fetch }).getConfig()).rejects.toBe(abort);
  });
});

describe('request', () => {
  it('calls_any_documented_route_with_typed_results', async () => {
    const { calls, fetch } = fakeFetch(json({ status: 'ok' }));
    const body = await createApiClient({ fetch }).request('get', '/api/v1/health/live');
    expect(body).toEqual({ status: 'ok' });
    expectTypeOf(body).toEqualTypeOf<{ status: 'ok' }>();
    expect(calls[0]?.url).toBe('/api/v1/health/live');
  });

  it('a_204_resolves_to_undefined', async () => {
    const { fetch } = fakeFetch(new Response(null, { status: 204 }));
    await expect(createApiClient({ fetch }).request('get', '/api/v1/health/live')).resolves.toBe(
      undefined,
    );
  });

  it('only_documented_routes_type_check', () => {
    const client = createApiClient({ fetch: fakeFetch().fetch });
    // @ts-expect-error -- not a route in openapi.json
    void client.request('get', '/api/v1/unknown').catch(() => undefined);
    // @ts-expect-error -- no POST on this route
    void client.request('post', '/api/v1/config').catch(() => undefined);
  });
});

describe('types for operations still to come', () => {
  interface WithEverything {
    parameters: { path: { id: string }; query?: { limit?: number } };
    requestBody: { content: { 'application/json': { note: string } } };
    responses: { 201: { content: { 'application/json': { id: string } } }; 400: unknown };
  }
  interface WithNothing {
    parameters: { query?: never; path?: never };
    requestBody?: never;
    responses: { 204: { content?: never } };
  }

  it('requires_path_parameters_and_body_when_declared', () => {
    expectTypeOf<{ path: { id: string }; body: { note: string } }>().toExtend<
      RequestOptions<WithEverything>
    >();
    expectTypeOf<{ body: { note: string } }>().not.toExtend<RequestOptions<WithEverything>>();
    expectTypeOf<{ path: { id: string } }>().not.toExtend<RequestOptions<WithEverything>>();
    expectTypeOf<{
      path: { id: string };
      body: { note: string };
      query: { limit: number };
    }>().toExtend<RequestOptions<WithEverything>>();
  });

  it('success_body_is_the_2xx_json', () => {
    expectTypeOf<SuccessBody<WithEverything>>().toEqualTypeOf<{ id: string }>();
    expectTypeOf<SuccessBody<WithNothing>>().toEqualTypeOf<undefined>();
  });
});

describe('buildRequestUrl', () => {
  it('fills_path_parameters_encoded', () => {
    expect(buildRequestUrl('', '/api/v1/expenses/{id}', { path: { id: 'a/b c' } })).toBe(
      '/api/v1/expenses/a%2Fb%20c',
    );
  });

  it('adds_defined_query_values_in_order', () => {
    expect(
      buildRequestUrl('https://x.test', '/api/v1/expenses', {
        query: { from: '2026-11-01', category: undefined, limit: 50, open: true },
      }),
    ).toBe('https://x.test/api/v1/expenses?from=2026-11-01&limit=50&open=true');
  });

  it('refuses_a_missing_path_parameter', () => {
    expect(() => buildRequestUrl('', '/api/v1/expenses/{id}', {})).toThrow(/id/);
  });
});
