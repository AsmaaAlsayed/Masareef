// Release check for the privacy policy and the terms (FR-039 criteria 3 to 5): fails when either
// document lacks an English or an Arabic version (or it is empty, or written for another version),
// a version is not a whole number, an effective date is not a calendar date, GET /api/v1/config
// serves a version other than the documents', a document is still a draft, or the contact address
// is still a placeholder. Part of the release checklist, not the pull-request pipeline: it fails
// until the legal text (T-086) and the contact address (P-12) exist.
//
// `npm run release:check-policies` (from the repository root). Run through tsx, which loads the
// TypeScript sources.
import console from 'node:console';
import process from 'node:process';
import { checkPolicies, POLICY_LIBRARY, policyReleaseReport } from '@masareef/core';
import { createApp } from '../src/app.ts';
import { createWorkersPlatform } from '../src/platform.ts';

/** The versions the real route serves, asked of the application itself, as a client would. */
async function servedVersions() {
  const app = createApp((bindings) => ({
    ...createWorkersPlatform(bindings),
    // The request log line is not part of this report.
    writeLog: () => undefined,
  }));
  // `/config` needs neither the database nor any secret; these only satisfy the start-up check.
  const bindings = { DB: {}, RELEASE: 'release-check' };
  const response = await app.request(
    'https://release-check.invalid/api/v1/config',
    undefined,
    bindings,
  );
  if (!response.ok) throw new Error(`GET /api/v1/config answered ${response.status}`);
  const config = await response.json();
  return { privacy: config.privacyVersion, terms: config.termsVersion };
}

const report = policyReleaseReport(checkPolicies(POLICY_LIBRARY, await servedVersions()));
for (const line of report.lines) (report.passed ? console.log : console.error)(line);
if (!report.passed) process.exitCode = 1;
