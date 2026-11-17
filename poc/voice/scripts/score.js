// Parser-only score on typed transcripts (T-007; ADR 0003, Consequences). Runs every sentence
// of both manifests through parseUtterance and writes reports/typed-transcripts.md.
// Usage: node scripts/score.js [--check] (build first). --check fails if the committed
// report differs from a fresh run, without writing it.
import console from 'node:console';
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';
import { parseUtterance } from '@masareef/core';
import { renderReport, scoreManifest } from '../dist/index.js';
import { DEFAULT_MANIFESTS, loadManifest } from './manifests.js';

const REPORT = fileURLToPath(new URL('../reports/typed-transcripts.md', import.meta.url));
const check = process.argv.includes('--check');

const loaded = DEFAULT_MANIFESTS.map(loadManifest);
const invalid = loaded.filter(({ result }) => !result.ok);
if (invalid.length > 0) {
  for (const { path } of invalid) console.error(`INVALID ${path}: run npm run voice:validate`);
  process.exit(1);
}

const scores = loaded.map(({ result }) => scoreManifest(result.manifest, parseUtterance));
const report = renderReport(scores);
for (const { language, overall } of scores) {
  const pct = (n) => `${((n / overall.total) * 100).toFixed(1)}%`;
  console.log(
    `${language}: all three fields ${overall.allFields}/${overall.total} (${pct(overall.allFields)}), ` +
      `amount ${overall.amount}/${overall.total} (${pct(overall.amount)}), ` +
      `currency ${overall.currency}/${overall.total} (${pct(overall.currency)})  [parser only, typed]`,
  );
}

if (check) {
  let committed;
  try {
    committed = readFileSync(REPORT, 'utf8');
  } catch {
    committed = undefined;
  }
  if (committed !== report) {
    console.error(`${REPORT} is out of date: run npm run voice:score and commit it`);
    process.exitCode = 1;
  } else {
    console.log(`${REPORT} is up to date`);
  }
} else {
  writeFileSync(REPORT, report);
  console.log(`wrote ${REPORT}`);
}
