import type { Platform } from '../platform.js';
import { selectOne } from '../repositories/health.js';

export const READINESS_TIMEOUT_MS = 2000;

export type Readiness =
  | { readonly ready: true }
  | { readonly ready: false; readonly reason: 'database_timeout' }
  | { readonly ready: false; readonly reason: 'database_unavailable'; readonly error: unknown };

export async function checkReadiness(platform: Platform): Promise<Readiness> {
  const deadline = platform.startDeadline(READINESS_TIMEOUT_MS);
  try {
    return await Promise.race([
      selectOne(platform.database()).then((): Readiness => ({ ready: true })),
      deadline.expired.then((): Readiness => ({ ready: false, reason: 'database_timeout' })),
    ]);
  } catch (error) {
    return { ready: false, reason: 'database_unavailable', error };
  } finally {
    deadline.cancel();
  }
}
