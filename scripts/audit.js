// Dependency audit gate (NFR-020; dependencies standard rule 8).
// Reads the output of `npm audit --json` on standard input and fails on any High or Critical
// advisory, except advisories listed in audit-exceptions.json with a reason and an expiry date
// that has not passed. Usage: npm audit --json | node scripts/audit.js
// An expired exception fails the build, so an exception cannot outlive its review date.
import console from 'node:console';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';

const BLOCKING = new Set(['high', 'critical']);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const advisoryId = (url) => /GHSA(?:-[0-9a-z]{4}){3}/.exec(String(url))?.[0] ?? String(url);

/**
 * @param {any} report parsed output of `npm audit --json`
 * @param {Array<{id?: string, reason?: string, expires?: string}>} exceptions
 * @param {string} today ISO date, YYYY-MM-DD
 */
export function evaluate(report, exceptions, today) {
  const failures = [];
  const accepted = new Set();

  const valid = new Map();
  for (const entry of exceptions) {
    if (!entry?.id || !entry.reason || !DATE.test(entry.expires ?? '')) {
      failures.push(`invalid exception entry: ${JSON.stringify(entry)}`);
    } else {
      valid.set(entry.id, entry);
    }
  }

  if (!report || typeof report.vulnerabilities !== 'object' || report.vulnerabilities === null) {
    failures.push(`npm audit did not return a report: ${JSON.stringify(report?.error ?? report)}`);
    return { failures, accepted: [], unused: [] };
  }

  const seen = new Set();
  for (const vulnerability of Object.values(report.vulnerabilities)) {
    for (const via of vulnerability.via ?? []) {
      if (typeof via !== 'object' || !BLOCKING.has(via.severity)) continue;
      const id = advisoryId(via.url);
      if (seen.has(id)) continue;
      seen.add(id);
      const exception = valid.get(id);
      if (!exception) {
        failures.push(`${via.severity} advisory ${id} in ${via.name}: ${via.title ?? ''}`.trim());
      } else if (exception.expires < today) {
        failures.push(
          `exception for ${id} expired on ${exception.expires}; fix, re-approve or remove it`,
        );
      } else {
        accepted.add(id);
      }
    }
  }

  const unused = [...valid.keys()].filter((id) => !seen.has(id));
  return { failures, accepted: [...accepted], unused };
}

function main() {
  let report;
  try {
    report = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    report = { error: 'no readable npm audit report on standard input' };
  }
  const exceptions = JSON.parse(
    readFileSync(new URL('../audit-exceptions.json', import.meta.url), 'utf8'),
  );
  const today = new Date().toISOString().slice(0, 10);
  const { failures, accepted, unused } = evaluate(report, exceptions, today);

  for (const id of accepted) console.warn(`accepted by time-boxed exception: ${id}`);
  for (const id of unused) console.warn(`exception no longer needed, remove it: ${id}`);
  if (failures.length > 0) {
    for (const failure of failures) console.error(`audit failure: ${failure}`);
    process.exit(1);
  }
  console.log('dependency audit passed (no unexcepted High or Critical advisories)');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
