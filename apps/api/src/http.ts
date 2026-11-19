import type { Context } from 'hono';
import { ConfigurationError } from './config.js';
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
    release: string | undefined;
    failure: RequestFailure | undefined;
    session: Session | undefined;
  };
}

const TITLES = {
  401: 'Unauthorized',
  404: 'Not Found',
  413: 'Content Too Large',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
} as const;

export type ProblemStatus = keyof typeof TITLES;
export type ProblemCode = 'unauthenticated' | 'not_found' | 'too_large' | 'internal' | 'not_ready';

/**
 * Takes the decoded path the router sees. Variants in case or with repeated slashes count as API
 * paths too: they match no route, but they get the API's refusal rather than a different answer.
 */
export function isApiPath(path: string): boolean {
  return /^\/+api(?:\/|$)/i.test(path);
}

/** An RFC 9457 response. `code` is the stable value the clients translate. */
export function problem(c: Context<AppEnv>, status: ProblemStatus, code: ProblemCode): Response {
  const body = {
    type: 'about:blank',
    title: TITLES[status],
    status,
    code,
    request_id: c.get('requestId'),
  };
  return c.body(JSON.stringify(body), status, { 'Content-Type': 'application/problem+json' });
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
