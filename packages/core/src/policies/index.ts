import { privacyAr } from './privacy.ar.js';
import { privacyEn } from './privacy.en.js';
import { termsAr } from './terms.ar.js';
import { termsEn } from './terms.en.js';
import type { PolicyLibrary } from './types.js';
import { POLICY_CONTACT, POLICY_VERSIONS } from './versions.js';

export {
  checkPolicies,
  describePolicyProblem,
  policyDocument,
  policyReleaseReport,
  policyTexts,
} from './check.js';
export type {
  PolicyProblem,
  PolicyProblemKind,
  PolicyReleaseReport,
  ServedPolicyVersions,
} from './check.js';
export { POLICY_SOURCES } from './sources.js';
export { POLICY_KINDS } from './types.js';
export type {
  PolicyBlock,
  PolicyContact,
  PolicyDocument,
  PolicyKind,
  PolicyLibrary,
  PolicyRun,
  PolicySection,
  PolicyText,
  PolicyVersion,
} from './types.js';
export { POLICY_CONTACT, POLICY_VERSIONS } from './versions.js';

/**
 * The privacy policy and the terms (FR-039) as the app ships them: long structured text, kept as
 * one module per document and language rather than in the interface translations, so a language
 * version can be missing (and is then reported, never replaced) and is versioned as a whole.
 */
export const POLICY_LIBRARY: PolicyLibrary = Object.freeze({
  versions: POLICY_VERSIONS,
  documents: Object.freeze({
    privacy: Object.freeze({ en: privacyEn, ar: privacyAr }),
    terms: Object.freeze({ en: termsEn, ar: termsAr }),
  }),
  contact: POLICY_CONTACT,
});
