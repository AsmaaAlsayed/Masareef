/** Everything the Worker cannot serve a request without. Later tasks add their own entries. */
export const REQUIRED_VARIABLES = ['DB', 'RELEASE'] as const;

/** Every variable the Worker reads; the only names a log line may report as missing or invalid. */
export const CONFIGURATION_VARIABLES = [...REQUIRED_VARIABLES, 'GOOGLE_CLIENT_ID'] as const;

/**
 * Google's public OAuth client id for the web (architecture, "Secrets": public by design). Optional:
 * until the product owner registers one (P-05) Google sign-in is off and `/config` says `null`. When
 * set it must look like a client id, so that a credential pasted into the wrong variable is refused
 * on every request instead of being published by `GET /config`.
 */
const GOOGLE_CLIENT_ID = /^\d+-[0-9a-z]+\.apps\.googleusercontent\.com$/;

export interface Config {
  readonly release: string;
  readonly googleClientId: string | null;
}

/** Names the variables that are missing or malformed. Values are never put in the message. */
export class ConfigurationError extends Error {
  constructor(readonly variables: readonly string[]) {
    super(`Missing or invalid configuration: ${variables.join(', ')}`);
    this.name = 'ConfigurationError';
  }
}

function isPresent(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== '';
  return typeof value === 'object' && value !== null;
}

/** `undefined` when the value is malformed; `null` when Google sign-in is not configured. */
function readGoogleClientId(value: unknown): string | null | undefined {
  if (value === undefined || (typeof value === 'string' && value.trim() === '')) return null;
  if (typeof value !== 'string' || !GOOGLE_CLIENT_ID.test(value.trim())) return undefined;
  return value.trim();
}

export function loadConfig(values: Readonly<Record<string, unknown>>): Config {
  const invalid: string[] = REQUIRED_VARIABLES.filter((name) => !isPresent(values[name]));
  const googleClientId = readGoogleClientId(values['GOOGLE_CLIENT_ID']);
  if (googleClientId === undefined) invalid.push('GOOGLE_CLIENT_ID');
  if (invalid.length > 0 || googleClientId === undefined) throw new ConfigurationError(invalid);
  return { release: values['RELEASE'] as string, googleClientId };
}
