import { CONFIGURATION_VARIABLES } from './config.js';

/**
 * The fields a log line may hold (architecture, "Observability"; NFR-023). Each has a rule for its
 * value as well, so personal data passed by mistake in an allowed field is dropped too.
 */
export interface LogFields {
  ts?: string;
  level?: 'info' | 'error';
  request_id?: string;
  method?: string;
  route?: string;
  status?: number;
  duration_ms?: number;
  release?: string | undefined;
  client?: string;
  error_code?: string | undefined;
  stack?: string | undefined;
  missing_variables?: readonly string[] | undefined;
}

export const ANDROID_CLIENT = /^android\/\d{1,5}(?:\.\d{1,5}){0,3}$/;

const METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
const VARIABLE_NAMES = new Set<string>(CONFIGURATION_VARIABLES);
const STACK_FRAME =
  /^at (?:(?:async |new )*[^\s@()]+(?: \[as [^\s@()]+\])? \([^\s@()]+:\d+:\d+\)|(?:async )?[^\s@()]+:\d+:\d+)$/;

function matching(pattern: RegExp) {
  return (value: unknown) => (typeof value === 'string' && pattern.test(value) ? value : undefined);
}

function stackFrames(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  // The first line of a stack is the error message, which can quote user data.
  const frames = value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => STACK_FRAME.test(line));
  return frames.length > 0 ? frames.join('\n') : undefined;
}

const ALLOWED_FIELDS: Record<keyof LogFields, (value: unknown) => unknown> = {
  ts: matching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
  level: matching(/^(?:info|error)$/),
  request_id: matching(/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/),
  method: (value) => (typeof value === 'string' && METHODS.has(value) ? value : undefined),
  route: matching(/^(?:unmatched|\/[\w\-./:*]*)$/),
  status: (value) =>
    Number.isInteger(value) && (value as number) >= 100 && (value as number) <= 599
      ? value
      : undefined,
  duration_ms: (value) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined,
  release: matching(/^[\w.-]{1,64}$/),
  client: (value) =>
    value === 'web' || (typeof value === 'string' && ANDROID_CLIENT.test(value))
      ? value
      : undefined,
  error_code: matching(/^[a-z][a-z_]{0,63}$/),
  stack: stackFrames,
  missing_variables: (value) =>
    Array.isArray(value) && value.every((name: string) => VARIABLE_NAMES.has(name))
      ? value
      : undefined,
};

export type Logger = (fields: LogFields) => void;

export function createLogger(write: (line: string) => void): Logger {
  return (fields) => {
    const entry: Record<string, unknown> = {};
    for (const [name, sanitise] of Object.entries(ALLOWED_FIELDS)) {
      const value = sanitise((fields as Record<string, unknown>)[name]);
      if (value !== undefined) entry[name] = value;
    }
    write(JSON.stringify(entry));
  };
}
