import type { PolicyKind } from './types.js';

/**
 * Source map of the draft documents (version 1): for each section id, where every statement in
 * that section comes from. "Data table" is the Data section of docs/02-requirements.md; "Arch" is
 * docs/03-architecture.md; ADRs are in docs/adr. Nothing in the drafts goes beyond these sources;
 * the legal reviewer (OQ-06) and the T-086 checklist verify the text against them.
 */
export const POLICY_SOURCES: Readonly<
  Record<PolicyKind, Readonly<Record<string, readonly string[]>>>
> = {
  privacy: {
    about: [
      'Vision: product and platforms',
      'Requirements Glossary: "Operator" (runs the service alone)',
      'FR-010, FR-017, FR-023 (voice entry is on Android)',
    ],
    stored: [
      'Data table (each row and why it is stored)',
      'FR-003 c4 (confirmation time and terms version)',
      'FR-005 note and Arch Authentication (Google: subject identifier and email only)',
      'NFR-017 and Arch Authentication (Argon2id)',
      'Arch Data model: session ip_address and user_agent always null; verification table',
      'FR-002 c1 (24-hour verification link)',
    ],
    'security-records': [
      'Arch Data model: rate_limit, auth_lockout (keyed HMAC, no raw IP or email), deletion_ledger (30 days)',
      'Arch C5 scheduled jobs: cleanup-expired',
      'Not yet in the Data table: change request CR-03',
    ],
    'not-stored': [
      'Data table: "Not stored anywhere"',
      'Arch Data model design notes; Arch Observability (never logged: IP address)',
      'ADR 0008 (no IP address stored with the counts)',
    ],
    voice: ['FR-023', 'FR-024', 'FR-032 c1 to c4', 'NFR-021', 'NFR-008'],
    statistics: [
      'FR-040 c1, c2, c4',
      'FR-041 c1 to c4 (the seven events and their fields)',
      'NFR-022',
      'ADR 0008 (built-in counters, no per-event row, sent without cookie or token)',
      'Data table: anonymous usage events and counts kept without limit',
    ],
    logs: [
      'Data table: application logs, 30 days',
      'Arch Observability (log fields, never logged, client error reports)',
      'NFR-023, NFR-024, NFR-028',
      'ADR 0008 (client error reports instead of a hosted tracker)',
      'FR-037 note (the version check sends only version and platform)',
    ],
    hosting: [
      'ADR 0009 (EU jurisdiction; processors table: Cloudflare, Resend with 30-day logs and storage location to be confirmed, Google, Have I Been Pwned, GitHub backup job)',
      'ADR 0004',
      'Arch Interfaces, "External services" (first 5 characters of the SHA-1)',
      'Data table, "Who may see it" (not shared or sold; providers act for the operator)',
    ],
    access: [
      'FR-019; Requirements Roles (one role, no administrator)',
      'Data table, "Who may see it"; RA-33',
      'Arch Authorisation note on operator access (two-factor authentication)',
    ],
    protection: [
      'NFR-020 (HTTPS)',
      'NFR-023 (encrypted at rest); Arch Stack (D1 encryption at rest)',
      'NFR-015 (encrypted backups)',
      'Arch Authentication: Android token in Keystore-encrypted storage, removed on sign-out',
    ],
    device: [
      'Arch C1 (what the client persists on the device; no expense data persisted)',
      'FR-006 c3, c4; FR-037 c2 (update notice dismissal)',
      'Arch Authentication (Android token)',
    ],
    retention: [
      'NFR-024',
      'NFR-015 (daily backups, kept 30 days)',
      'NFR-018 (30 days without activity)',
      'FR-002 c5 (unverified accounts after 7 days)',
      'Arch Data model: deletion is a hard delete',
      'Data table: "Kept until"',
    ],
    deletion: ['FR-009 c1 to c4', 'RA-09', 'NFR-024'],
    age: ['Vision (18 or over)', 'FR-003', 'RA-04 (self-declared, no date of birth)'],
    changes: ['FR-039 c4'],
    contact: ['FR-039 c3', 'P-12 and OQ-07 (address not yet created)'],
    legal: ['OQ-02, OQ-04, OQ-06; P-13 (legal text not written by the delivery team)'],
  },
  terms: {
    about: ['Vision: product and platforms', 'FR-017 (one account on web and Android)'],
    eligibility: [
      'Vision (18 or over; sign-up open worldwide)',
      'FR-003 c1 (confirmation of age and acceptance of terms and privacy policy)',
    ],
    account: [
      'FR-019; Requirements Roles',
      'FR-002 c1, c2, c5',
      'FR-005',
      'NFR-017 (minimum 15 characters)',
      'NFR-019 (5 failures lock the account for 15 minutes)',
      'NFR-018, FR-008 (30 days without activity)',
    ],
    use: [
      'FR-010 to FR-013',
      'FR-017',
      'FR-023',
      'FR-024',
      'NFR-001 to NFR-003 (accuracy targets below 100%)',
    ],
    android: [
      'FR-035 c1, c2 ("download only from this page"; Android 8.0)',
      'Requirements Integrations: Google Play not integrated',
      'NFR-026',
      'FR-037, FR-038',
    ],
    ending: ['FR-009', 'RA-09'],
    changes: ['FR-039 c4'],
    contact: ['FR-039 c3', 'P-12 and OQ-07'],
    legal: ['OQ-06; P-13 (liability, warranties, governing law, disputes, suspension)'],
  },
};
