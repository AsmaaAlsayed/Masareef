/** Everything the Worker cannot serve a request without. Later tasks add their own entries. */
export const REQUIRED_VARIABLES = ['DB', 'RELEASE'] as const;

export interface Config {
  readonly release: string;
}

export class ConfigurationError extends Error {
  constructor(readonly variables: readonly string[]) {
    super(`Missing required configuration: ${variables.join(', ')}`);
    this.name = 'ConfigurationError';
  }
}

function isPresent(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== '';
  return typeof value === 'object' && value !== null;
}

export function loadConfig(values: Readonly<Record<string, unknown>>): Config {
  const missing = REQUIRED_VARIABLES.filter((name) => !isPresent(values[name]));
  if (missing.length > 0) throw new ConfigurationError(missing);
  return { release: values['RELEASE'] as string };
}
