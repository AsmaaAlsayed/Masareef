import { POLICY_VERSIONS as DOCUMENTS } from '@masareef/core';

/**
 * The current versions of the terms and the privacy policy, served by `GET /config` and recorded
 * with each account's acceptance (FR-003 criterion 4). They are read from the documents themselves
 * in packages/core (src/policies/versions.ts), the one place a version is raised, which the
 * `/privacy` and `/terms` pages show too; `npm run release:check-policies` confirms that this
 * route serves what the documents say.
 */
export const POLICY_VERSIONS = {
  terms: DOCUMENTS.terms.version,
  privacy: DOCUMENTS.privacy.version,
} as const;
