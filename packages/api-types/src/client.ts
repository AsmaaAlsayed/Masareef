import type { components, paths } from './schema.js';

/**
 * A small client for the Masareef API, typed from apps/api/openapi.json and built on `fetch` only.
 * The web app sends the session cookie by itself (same origin) and sends no extra header; the
 * Android app passes `client: 'android/<version>'`, sent as `X-Client` (architecture, "Interfaces").
 * Bearer tokens arrive with Android sign-in (T-037).
 */

export type PublicConfig = components['schemas']['Config'];
export type Problem = components['schemas']['Problem'];

/** A server code, or one of the two failures the client itself detects. */
export type ApiErrorCode = Problem['code'] | 'network_error' | 'unexpected_response';

export interface FieldError {
  readonly field: string;
  readonly code: string;
}

/**
 * Any failed call. `code` is what the screen translates. A server newer than this client can send
 * a code missing from the union, so a translation table needs a fallback entry.
 */
export class ApiError extends Error {
  constructor(
    /** HTTP status; 0 when no response arrived. */
    readonly status: number,
    readonly code: ApiErrorCode,
    /** Shown on the error screen so a report leads to the log line (NFR-028). */
    readonly requestId: string | undefined,
    readonly errors: readonly FieldError[] = [],
    options?: { cause?: unknown },
  ) {
    super(`API request failed: ${status} ${code}`, options);
    this.name = 'ApiError';
  }
}

export type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

/** The documented paths that accept the method. */
export type PathsWith<M extends HttpMethod> = {
  [P in keyof paths]: paths[P][M] extends { responses: unknown } ? P : never;
}[keyof paths];

type Operation<P extends keyof paths, M extends HttpMethod> = NonNullable<paths[P][M]>;

type SuccessStatus = 200 | 201 | 202 | 204;
type JsonContent<R> = R extends { content: { 'application/json': infer B } } ? B : undefined;
export type SuccessBody<O> = O extends { responses: infer R }
  ? { [S in keyof R & SuccessStatus]: JsonContent<R[S]> }[keyof R & SuccessStatus]
  : never;

type Parameters<O> = O extends { parameters: infer X } ? X : never;
type PathParameters<O> = Parameters<O> extends { path: infer X } ? X : never;
type QueryParameters<O> = Parameters<O> extends { query?: infer X } ? X : never;
type JsonBody<O> = O extends { requestBody: { content: { 'application/json': infer B } } }
  ? B
  : never;

/** Each part is required when the operation requires it and absent when it has none. */
export type RequestOptions<O> = { readonly signal?: AbortSignal } & ([PathParameters<O>] extends [
  never,
]
  ? unknown
  : { readonly path: PathParameters<O> }) &
  ([QueryParameters<O>] extends [undefined] ? unknown : { readonly query?: QueryParameters<O> }) &
  ([JsonBody<O>] extends [never] ? unknown : { readonly body: JsonBody<O> });

type OptionsArgument<O> = [PathParameters<O> | JsonBody<O>] extends [never]
  ? [options?: RequestOptions<O>]
  : [options: RequestOptions<O>];

export interface ApiClientOptions {
  /** The API's origin: empty for the same origin (web), the full origin on Android. */
  readonly baseUrl?: string;
  readonly fetch?: (input: string, init: RequestInit) => Promise<Response>;
  /** Sent as `X-Client`; only the Android app sets it, as `android/<version>`. */
  readonly client?: string;
}

export interface ApiClient {
  getConfig(options?: { readonly signal?: AbortSignal }): Promise<PublicConfig>;
  request<M extends HttpMethod, P extends PathsWith<M>>(
    method: M,
    path: P,
    ...options: OptionsArgument<Operation<P, M>>
  ): Promise<SuccessBody<Operation<P, M>>>;
}

type QueryValue = string | number | boolean | undefined;

interface UrlParts {
  readonly path?: Readonly<Record<string, string | number>>;
  readonly query?: Readonly<Record<string, QueryValue>>;
}

export function buildRequestUrl(baseUrl: string, template: string, parts: UrlParts): string {
  const path = template.replaceAll(/\{([^}]+)\}/g, (_, name: string) => {
    const value = parts.path?.[name];
    if (value === undefined) throw new Error(`Missing path parameter: ${name}`);
    return encodeURIComponent(String(value));
  });
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(parts.query ?? {})) {
    if (value !== undefined) query.append(name, String(value));
  }
  const search = query.size > 0 ? `?${query.toString()}` : '';
  return `${baseUrl.replace(/\/+$/, '')}${path}${search}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function fieldErrors(value: unknown): FieldError[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown) =>
    isRecord(item) && typeof item['field'] === 'string' && typeof item['code'] === 'string'
      ? [{ field: item['field'], code: item['code'] }]
      : [],
  );
}

async function errorFrom(response: Response): Promise<ApiError> {
  const headerId = response.headers.get('X-Request-Id') ?? undefined;
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.startsWith('application/problem+json')) {
    const body: unknown = await response.json().catch(() => undefined);
    if (isRecord(body) && typeof body['code'] === 'string') {
      const requestId = typeof body['request_id'] === 'string' ? body['request_id'] : headerId;
      // Trusted to be a server code: it came from our own API in problem form.
      const code = body['code'] as Problem['code'];
      return new ApiError(response.status, code, requestId, fieldErrors(body['errors']));
    }
  }
  return new ApiError(response.status, 'unexpected_response', headerId);
}

function isAbort(error: unknown): boolean {
  return isRecord(error) && error['name'] === 'AbortError';
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseUrl = options.baseUrl ?? '';
  const send = options.fetch ?? ((input, init) => fetch(input, init));

  async function call(
    method: HttpMethod,
    path: string,
    parts: UrlParts & { readonly body?: unknown; readonly signal?: AbortSignal } = {},
  ): Promise<unknown> {
    const headers = new Headers({ Accept: 'application/json' });
    if (options.client !== undefined) headers.set('X-Client', options.client);
    const init: RequestInit = { method: method.toUpperCase(), headers };
    if (parts.body !== undefined) {
      headers.set('Content-Type', 'application/json');
      init.body = JSON.stringify(parts.body);
    }
    if (parts.signal !== undefined) init.signal = parts.signal;

    let response: Response;
    try {
      response = await send(buildRequestUrl(baseUrl, path, parts), init);
    } catch (error) {
      if (isAbort(error)) throw error;
      throw new ApiError(0, 'network_error', undefined, [], { cause: error });
    }

    if (!response.ok) throw await errorFrom(response);
    if (response.status === 204) return undefined;
    try {
      return await response.json();
    } catch (error) {
      throw new ApiError(
        response.status,
        'unexpected_response',
        response.headers.get('X-Request-Id') ?? undefined,
        [],
        { cause: error },
      );
    }
  }

  return {
    getConfig: (callOptions = {}) =>
      call('get', '/api/v1/config', callOptions) as Promise<PublicConfig>,
    request: (method, path, ...[requestOptions]) => call(method, path, requestOptions) as never,
  };
}
