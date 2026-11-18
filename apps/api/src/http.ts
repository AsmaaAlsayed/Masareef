import type { Context } from 'hono';
import { ConfigurationError } from './config.js';
import type { Platform, WorkerBindings } from './platform.js';

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
  };
}

const TITLES = {
  404: 'Not Found',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
} as const;

export type ProblemStatus = keyof typeof TITLES;
export type ProblemCode = 'not_found' | 'internal' | 'not_ready';

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
