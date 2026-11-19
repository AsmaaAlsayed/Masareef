import type { Platform } from './platform.js';

export interface Session {
  readonly userId: string;
}

/** Finds the session a request proves, or null. T-022 supplies the real one (Better Auth). */
export type Authenticator = (request: Request, platform: Platform) => Promise<Session | null>;

/** There is no session system yet, so nothing a request carries can produce a session. */
export const noSession: Authenticator = () => Promise.resolve(null);
