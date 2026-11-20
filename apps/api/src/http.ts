import type { Context } from 'hono';
import { ConfigurationError } from './config.js';
import type { Config } from './config.js';
import type { Platform, WorkerBindings } from './platform.js';
import type { Session } from './session.js';

/** Why a request failed, for its log line. None of this reaches the client. */
export interface RequestFailure {
  readonly errorCode: string;
  readonly error?: unknown;
  readonly missingVariables?: readonly string[];
}

export interface AppEnv {
  Bindings: WorkerBindings;
  Variables: {
    platform: Platform;
    requestId: string;
    config: Config;
    release: string | undefined;
    failure: RequestFailure | undefined;
    session: Session | undefined;
    /** Set when the response came from the web build, for the log line. */
    servedStatic: boolean | undefined;
  };
}

export const PROBLEM_TITLES = {
  400: 'Bad Request',
  401: 'Unauthorized',
  404: 'Not Found',
  413: 'Content Too Large',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
} as const;

export type ProblemStatus = keyof typeof PROBLEM_TITLES;

/** The stable codes the clients translate (architecture, "Interfaces"). Later tasks add theirs. */
export const PROBLEM_CODES = [
  'validation_failed',
  'unauthenticated',
  'not_found',
  'too_large',
  'internal',
  'not_ready',
] as const;
export type ProblemCode = (typeof PROBLEM_CODES)[number];

/** One rejected input value: where it was and why, never the value itself. */
export interface FieldError {
  readonly field: string;
  readonly code: string;
}

/**
 * Takes the decoded path the router sees. Variants in case, with repeated slashes or with an encoded
 * slash after `api` count as API paths too: they match no route, but they get the API's refusal
 * rather than a different answer, and are never handed to the web build (T-017).
 */
export function isApiPath(path: string): boolean {
  return /^\/+api(?:\/|%2f|$)/i.test(path);
}

/** Outside `/api`, only these methods reach the web build; anything else is a 404. */
export function isPageRequest(method: string, path: string): boolean {
  return (method === 'GET' || method === 'HEAD') && !isApiPath(path);
}

/**
 * An RFC 9457 response. `code` is the stable value the clients translate. Typed like `c.json`, so a
 * route can return it for a problem response its OpenAPI definition declares.
 */
export function problem<S extends ProblemStatus>(
  c: Context<AppEnv>,
  status: S,
  code: ProblemCode,
  errors?: readonly FieldError[],
) {
  const body = {
    type: 'about:blank',
    title: PROBLEM_TITLES[status],
    status,
    code,
    request_id: c.get('requestId'),
    ...(errors === undefined ? {} : { errors: errors.map(({ field, code }) => ({ field, code })) }),
  };
  return c.json(body, status, { 'Content-Type': 'application/problem+json' });
}

/** An expected refusal: the code also goes on the request's log line. */
export function refuse(c: Context<AppEnv>, status: ProblemStatus, code: ProblemCode): Response {
  c.set('failure', { errorCode: code });
  return problem(c, status, code);
}

/** The catch-all: details go to the log line, the client gets only the generic problem. */
export function unexpectedError(c: Context<AppEnv>, error: unknown): Response {
  c.set(
    'failure',
    error instanceof ConfigurationError
      ? { errorCode: 'configuration_missing', error, missingVariables: error.variables }
      : { errorCode: 'internal', error },
  );
  return problem(c, 500, 'internal');
}
