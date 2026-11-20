/**
 * The current versions of the terms and the privacy policy, served by `GET /config` and recorded
 * with each account's acceptance. One constant for now: no document is published yet, so these
 * mark the drafts. T-023 writes the documents (FR-039) and owns these values from then on; a
 * published change raises the version, which is what makes the change notice appear.
 */
export const POLICY_VERSIONS = {
  terms: '0',
  privacy: '0',
} as const;
