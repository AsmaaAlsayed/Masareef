import { POLICY_KINDS } from '@masareef/core';
import type { PolicyKind } from '@masareef/core';

/**
 * Where the versions of the privacy policy and terms this device last saw are kept (architecture
 * C1: "the last-seen policy version"), as JSON: `{"privacy":"1","terms":"1"}`.
 */
export const POLICY_VERSIONS_STORAGE_KEY = 'masareef.policyVersions';

/** A version of each document, as `GET /config` serves them. */
export type PolicyVersions = Readonly<Record<PolicyKind, string>>;

export interface PolicySeenStore {
  /** The versions last seen on this device; `undefined` when none, or the value is unreadable. */
  read(): PolicyVersions | undefined;
  write(versions: PolicyVersions): void;
}

function parse(text: string | null): PolicyVersions | undefined {
  if (text === null) return undefined;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const privacy: unknown = Reflect.get(value, 'privacy');
  const terms: unknown = Reflect.get(value, 'terms');
  return typeof privacy === 'string' && typeof terms === 'string' ? { privacy, terms } : undefined;
}

/**
 * Device storage, guarded like `deviceLanguageStore`: storage can be unavailable and even reaching
 * `localStorage` can throw. Then nothing is remembered and no change notice is shown, which is the
 * same as a first visit on every visit.
 */
export function devicePolicySeenStore(
  storage: () => Storage = () => window.localStorage,
): PolicySeenStore {
  return {
    read() {
      try {
        return parse(storage().getItem(POLICY_VERSIONS_STORAGE_KEY));
      } catch {
        return undefined;
      }
    },
    write(versions) {
      try {
        storage().setItem(
          POLICY_VERSIONS_STORAGE_KEY,
          JSON.stringify({ privacy: versions.privacy, terms: versions.terms }),
        );
      } catch {
        // Not remembered on this device: the notice may show again on the next visit.
        return;
      }
    },
  };
}

/**
 * The documents whose current version differs from the one this device last saw, in display order.
 * Nothing seen before (a first visit, cleared or unreadable storage) gives none: there is no
 * earlier version the person could have read, so nothing has changed for them; the caller then
 * records the current versions as seen. Versions are compared for equality, not order, so a
 * version taken back after a faulty release is announced too.
 */
export function changedPolicies(
  seen: PolicyVersions | undefined,
  current: PolicyVersions,
): PolicyKind[] {
  if (seen === undefined) return [];
  return POLICY_KINDS.filter((kind) => seen[kind] !== current[kind]);
}
