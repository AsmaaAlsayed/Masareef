import { createRoute, z } from '@hono/zod-openapi';
import { env } from 'cloudflare:workers';
import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import {
  assertRouteInventory,
  buildOpenApiDocument,
  createRouter,
  problemResponses,
  routeInventory,
  serializeOpenApiDocument,
} from './openapi.js';
import { createWorkersPlatform } from './platform.js';
import { PUBLIC_ROUTES } from './public-routes.js';

const ORIGIN = 'https://api.example.test';

/** The application exactly as the Worker builds it. */
function deployedApp() {
  return createApp(createWorkersPlatform);
}

function operations(document: ReturnType<typeof buildOpenApiDocument>) {
  return Object.entries(document.paths ?? {}).flatMap(([path, item]) =>
    Object.entries(item as Record<string, { responses: Record<string, unknown> }>).map(
      ([method, operation]) => ({ path, method, operation }),
    ),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

describe('route inventory (NFR-016)', () => {
  it('openapi_lists_every_registered_route', () => {
    const { registered, documented } = routeInventory(deployedApp());
    expect(registered).toEqual(documented);
    expect(registered).toEqual([
      'GET /api/v1/config',
      'GET /api/v1/health/live',
      'GET /api/v1/health/ready',
    ]);
    expect(() => assertRouteInventory(deployedApp())).not.toThrow();
  });

  it('a_route_added_the_plain_way_is_not_in_the_document', () => {
    const app = deployedApp();
    app.get('/api/v1/plain', (c) => c.json({}));
    const { registered, documented } = routeInventory(app);
    expect(registered).toContain('GET /api/v1/plain');
    expect(documented).not.toContain('GET /api/v1/plain');
    expect(() => assertRouteInventory(app)).toThrow(/GET \/api\/v1\/plain/);
  });

  it('a_plain_sub_application_is_not_in_the_document', () => {
    const app = deployedApp();
    app.route(
      '/api/v1/extra',
      new Hono().get('/thing', (c) => c.json({})),
    );
    expect(() => assertRouteInventory(app)).toThrow(/GET \/api\/v1\/extra\/thing/);
  });

  it('a_route_hidden_from_the_document_is_reported', () => {
    const app = deployedApp();
    app.openapi(
      createRoute({
        method: 'get',
        path: '/api/v1/hidden',
        hide: true,
        responses: { 204: { description: 'Nothing' } },
      }),
      (c) => c.body(null, 204),
    );
    expect(() => assertRouteInventory(app)).toThrow(/GET \/api\/v1\/hidden/);
  });

  it('a_documented_route_that_is_not_served_is_reported', () => {
    const app = deployedApp();
    app.openAPIRegistry.registerPath({
      method: 'get',
      path: '/api/v1/ghost',
      responses: { 204: { description: 'Nothing' } },
    });
    expect(() => assertRouteInventory(app)).toThrow(
      /documented but not served: GET \/api\/v1\/ghost/,
    );
  });

  it('a_route_for_every_method_is_reported', () => {
    const app = deployedApp();
    app.all('/api/v1/anything', (c) => c.body(null, 204));
    expect(() => assertRouteInventory(app)).toThrow(/ALL \/api\/v1\/anything/);
  });

  it('a_path_parameter_is_compared_in_both_notations', () => {
    const app = deployedApp();
    app.openapi(
      createRoute({
        method: 'get',
        path: '/api/v1/things/{id}',
        request: { params: z.object({ id: z.string() }) },
        responses: { 204: { description: 'Nothing' } },
      }),
      (c) => c.body(null, 204),
    );
    expect(routeInventory(app).registered).toContain('GET /api/v1/things/{id}');
    expect(() => assertRouteInventory(app)).not.toThrow();
  });

  it('every_public_route_is_documented', () => {
    const { documented } = routeInventory(deployedApp());
    for (const route of PUBLIC_ROUTES) {
      expect(documented).toContain(`${route.method} ${route.path}`);
    }
  });
});

describe('openapi document', () => {
  it('documents_problem_responses_for_every_operation', () => {
    const document = buildOpenApiDocument(deployedApp());
    expect(document.openapi).toBe('3.1.0');
    expect(document.components?.schemas?.['Problem']).toBeDefined();
    for (const { path, method, operation } of operations(document)) {
      expect(operation.responses['500'], `${method} ${path}`).toEqual({
        description: expect.any(String) as string,
        content: {
          'application/problem+json': { schema: { $ref: '#/components/schemas/Problem' } },
        },
      });
    }
    const ready = document.paths?.['/api/v1/health/ready']?.get?.responses;
    expect(Object.keys(ready ?? {}).sort()).toEqual(['200', '500', '503']);
  });

  it('problem_responses_cover_the_common_refusals', () => {
    expect(Object.keys(problemResponses(401, 404, 413, 500, 503))).toEqual([
      '401',
      '404',
      '413',
      '500',
      '503',
    ]);
  });

  it('documents_the_config_response_with_exactly_four_fields', () => {
    const document = buildOpenApiDocument(deployedApp());
    const schema = document.components?.schemas?.['Config'] as {
      properties: Record<string, unknown>;
      required: string[];
      additionalProperties: unknown;
    };
    expect(Object.keys(schema.properties).sort()).toEqual([
      'googleClientId',
      'privacyVersion',
      'release',
      'termsVersion',
    ]);
    expect([...schema.required].sort()).toEqual(Object.keys(schema.properties).sort());
    expect(schema.additionalProperties).toBe(false);
  });

  it('serialisation_is_deterministic_with_sorted_keys', () => {
    const first = serializeOpenApiDocument(buildOpenApiDocument(deployedApp()));
    const second = serializeOpenApiDocument(buildOpenApiDocument(deployedApp()));
    expect(first).toBe(second);
    expect(first.endsWith('\n')).toBe(true);
    expect(first).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    const parsed = JSON.parse(first) as Record<string, unknown>;
    expect(Object.keys(parsed)).toEqual([...Object.keys(parsed)].sort());
    const paths = parsed['paths'] as Record<string, unknown>;
    expect(Object.keys(paths)).toEqual([...Object.keys(paths)].sort());
  });
});

describe('validation failures', () => {
  function appWithValidatedRoute() {
    const app = createApp(createWorkersPlatform, () => Promise.resolve({ userId: 'test-user' }));
    const router = createRouter().openapi(
      createRoute({
        method: 'get',
        path: '/items',
        request: { query: z.strictObject({ limit: z.coerce.number().int().min(1).max(50) }) },
        responses: {
          200: {
            description: 'The limit',
            content: { 'application/json': { schema: z.object({ limit: z.number() }) } },
          },
          ...problemResponses(400),
        },
      }),
      (c) => c.json({ limit: c.req.valid('query').limit }, 200),
    );
    app.route('/api/v1/test', router);
    return (path: string) =>
      app.fetch(new Request(`${ORIGIN}${path}`), { DB: env.DB, RELEASE: 'r1' });
  }

  it('invalid_input_returns_400_validation_failed_problem_json', async () => {
    const response = await appWithValidatedRoute()('/api/v1/test/items?limit=51');
    expect(response.status).toBe(400);
    expect(response.headers.get('Content-Type')).toBe('application/problem+json');
    const body = await response.json<Record<string, unknown>>();
    expect(body).toEqual({
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      code: 'validation_failed',
      request_id: response.headers.get('X-Request-Id'),
      errors: [{ field: 'limit', code: 'too_big' }],
    });
  });

  it('missing_input_names_the_field', async () => {
    const response = await appWithValidatedRoute()('/api/v1/test/items');
    expect(response.status).toBe(400);
    const body = await response.json<{ errors: unknown }>();
    expect(body.errors).toEqual([{ field: 'limit', code: 'invalid_type' }]);
  });

  it('an_unknown_field_is_rejected_by_name', async () => {
    const response = await appWithValidatedRoute()('/api/v1/test/items?limit=5&user_id=other');
    expect(response.status).toBe(400);
    const body = await response.json<{ errors: unknown }>();
    expect(body.errors).toEqual([{ field: 'user_id', code: 'unrecognized_keys' }]);
    expect(JSON.stringify(body)).not.toContain('other');
  });

  it('valid_input_reaches_the_route', async () => {
    const response = await appWithValidatedRoute()('/api/v1/test/items?limit=50');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ limit: 50 });
  });
});
