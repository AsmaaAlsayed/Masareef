import type { PolicyContact, PolicyKind, PolicyVersion } from './types.js';

/**
 * The single source of the current version and effective date of each document (FR-039
 * criterion 4). The pages show these, `GET /api/v1/config` serves them (apps/api/src/policies.ts),
 * a new account records the terms version it accepted (FR-003 criterion 4), and the change notice
 * compares them with the versions a device last saw.
 *
 * Versions are whole numbers, raised by one for each published change. They are independent of the
 * effective date, so two revisions on one day stay distinct and a version can be prepared before
 * the day it takes effect. When raising a version, update the text in both languages and their
 * `version` field too: until both match, the release check fails and that language shows "not
 * available" rather than an out-of-date text.
 *
 * Version 1 is the draft factual description written by the delivery team (T-023). It is not
 * legal text (OQ-06); the legal text replaces it in T-086 with a raised version.
 */
export const POLICY_VERSIONS: Readonly<Record<PolicyKind, PolicyVersion>> = Object.freeze({
  privacy: { version: '1', effectiveDate: '2026-11-21', draft: true },
  terms: { version: '1', effectiveDate: '2026-11-21', draft: true },
});

/**
 * The public contact address for privacy requests does not exist yet (prerequisite P-12, OQ-07).
 * The pages say it will be published, and the release check fails until it is set here.
 */
export const POLICY_CONTACT: PolicyContact = Object.freeze({ kind: 'placeholder' });
