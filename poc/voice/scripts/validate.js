// Validates the voice test-set manifests: fields, plausible tags and the NFR-001 / NFR-003
// composition (T-007). Usage: node scripts/validate.js [manifest.json ...] (build first).
// Exits with 1 and lists every problem when a manifest is invalid.
import console from 'node:console';
import process from 'node:process';
import { describeComposition } from '../dist/index.js';
import { DEFAULT_MANIFESTS, loadManifest } from './manifests.js';

const paths = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_MANIFESTS;
let failed = false;
for (const { path, result } of paths.map(loadManifest)) {
  if (result.ok) {
    console.log(`valid   ${path}\n        ${describeComposition(result.manifest)}`);
  } else {
    failed = true;
    console.error(`INVALID ${path}`);
    for (const error of result.errors) console.error(`        ${error}`);
  }
}
process.exitCode = failed ? 1 : 0;
