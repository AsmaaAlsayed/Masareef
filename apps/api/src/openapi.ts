import { OpenAPIHono, z } from '@hono/zod-openapi';
import type { Hook } from '@hono/zod-openapi';
import { PROBLEM_CODES, PROBLEM_TITLES, problem } from './http.js';
import type { AppEnv, FieldError, ProblemStatus } from './http.js';

/**
 * The OpenAPI description is generated from the routes themselves (architecture, "Interfaces"):
 * every route is registered through `createRouter().openapi(createRoute(...), handler)`, which both
 * validates its input and records it. `routeInventory` compares what the router will actually
 * serve with what the document says, so a route added any other way is caught by a test and by
 * `npm run openapi:check` (NFR-016: the route inventory the cross-account suite works from).
 */

export const ProblemSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    code: z.enum(PROBLEM_CODES),
    request_id: z.string(),
    errors: z
      .array(z.object({ field: z.string(), code: z.string() }))
      .optional()
      .openapi({ description: 'Present for validation_failed: one entry per rejected field.' }),
  })
  .openapi('Problem', {
    description:
      'RFC 9457 problem details. `code` is stable and is what the client translates; `request_id` matches the X-Request-Id header.',
  });

const PROBLEM_DESCRIPTIONS: Readonly<Record<ProblemStatus, string>> = {
  400: 'validation_failed: the input does not match the schema',
  401: 'unauthenticated: no valid session',
  404: 'not_found',
  413: 'too_large: the body is over 16,384 bytes',
  500: 'internal: an unexpected failure or incomplete configuration',
  503: 'not_ready: a dependency is unavailable',
};

interface ProblemResponse {
  readonly description: string;
  readonly content: {
    readonly 'application/problem+json': { readonly schema: typeof ProblemSchema };
  };
}

/** The problem responses a route can give, for its `responses`. Every route has at least 500. */
export function problemResponses<const S extends ProblemStatus>(
  ...statuses: S[]
): { readonly [K in S]: ProblemResponse } {
  const entries = statuses.map((status) => [
    status,
    {
      description: `${PROBLEM_TITLES[status]} (${PROBLEM_DESCRIPTIONS[status]})`,
      content: { 'application/problem+json': { schema: ProblemSchema } },
    },
  ]);
  return Object.fromEntries(entries) as { readonly [K in S]: ProblemResponse };
}

function fieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.flatMap((issue): FieldError[] => {
    const path = issue.path.map(String);
    return issue.code === 'unrecognized_keys'
      ? issue.keys.map((key) => ({ field: [...path, key].join('.'), code: issue.code }))
      : [{ field: path.join('.'), code: issue.code }];
  });
}

/** Rejects, never repairs: the field and the rule it broke, without the value that was sent. */
const validationFailed: Hook<unknown, AppEnv, string, Response | undefined> = (result, c) => {
  if (result.success) return undefined;
  c.set('failure', { errorCode: 'validation_failed' });
  return problem(c, 400, 'validation_failed', fieldErrors(result.error));
};

/** The only way to make a router: its routes validate input and appear in the OpenAPI document. */
export function createRouter(): OpenAPIHono<AppEnv> {
  return new OpenAPIHono<AppEnv>({ defaultHook: validationFailed });
}

const DOCUMENT_CONFIG = {
  openapi: '3.1.0',
  info: {
    title: 'Masareef API',
    version: 'v1',
    description:
      'Generated from the route schemas in apps/api by `npm run openapi:generate`. Do not edit by hand.',
  },
} as const;

export function buildOpenApiDocument(app: OpenAPIHono<AppEnv>) {
  return app.getOpenAPI31Document(DOCUMENT_CONFIG);
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (typeof value !== 'object' || value === null) return value;
  const entries = Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return Object.fromEntries(entries.map(([key, item]) => [key, sortKeys(item)]));
}

/** Stable output: keys sorted at every level, no timestamps, one trailing newline. */
export function serializeOpenApiDocument(document: unknown): string {
  return `${JSON.stringify(sortKeys(document), null, 2)}\n`;
}

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

export interface RouteInventory {
  /** `METHOD /path/{param}` for every handler the router serves. */
  readonly registered: readonly string[];
  /** `METHOD /path/{param}` for every operation in the OpenAPI document. */
  readonly documented: readonly string[];
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

export function routeInventory(app: OpenAPIHono<AppEnv>): RouteInventory {
  // Middleware is registered for every method under a wildcard path; nothing else may be.
  const registered = app.routes
    .filter((route) => !(route.method === 'ALL' && route.path.endsWith('*')))
    .map((route) => `${route.method} ${route.path.replaceAll(/:([^/]+)/g, '{$1}')}`);

  const paths = buildOpenApiDocument(app).paths ?? {};
  const documented = Object.entries(paths).flatMap(([path, item]) =>
    HTTP_METHODS.filter((method) => item[method] !== undefined).map(
      (method) => `${method.toUpperCase()} ${path}`,
    ),
  );
  return { registered: sortedUnique(registered), documented: sortedUnique(documented) };
}

/** Throws, naming each route, when the router and the document disagree. */
export function assertRouteInventory(app: OpenAPIHono<AppEnv>): void {
  const { registered, documented } = routeInventory(app);
  const undocumented = registered.filter((route) => !documented.includes(route));
  const unserved = documented.filter((route) => !registered.includes(route));
  if (undocumented.length === 0 && unserved.length === 0) return;
  throw new Error(
    [
      'The routes and the OpenAPI document disagree.',
      ...undocumented.map((route) => `  served but not documented: ${route}`),
      ...unserved.map((route) => `  documented but not served: ${route}`),
      'Register every route with createRouter().openapi(createRoute(...), handler).',
    ].join('\n'),
  );
}
