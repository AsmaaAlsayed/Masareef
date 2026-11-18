// Shared by the validate and score scripts: where the manifests are and how to read one.
import { readFileSync } from 'node:fs';
import { URL, fileURLToPath } from 'node:url';
import { validateManifest } from '../dist/index.js';

export const DEFAULT_MANIFESTS = ['ar-eg.json', 'en.json'].map((name) =>
  fileURLToPath(new URL(`../manifests/${name}`, import.meta.url)),
);

/** @param {string} path */
export function loadManifest(path) {
  let input;
  try {
    input = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return { path, result: { ok: false, errors: [`cannot read: ${String(error)}`] } };
  }
  return { path, result: validateManifest(input) };
}
