// import.meta.glob is provided by Vite, which Vitest runs on; this adds its type only.
/// <reference types="vite/types/importMeta.d.ts" />

import { describe, expect, it } from 'vitest';

/**
 * NFR-008 and ADR 0003: the parser returns data and cannot save anything. This guard reads
 * the parser's source files (and the core helpers it may use) as text and fails when any of
 * them imports a module outside that set or names a network or storage API.
 */

/** Core modules outside the parser that the parser may import: pure data and helpers. */
const ALLOWED_CORE_MODULES = [
  '../categories.ts',
  '../currencies.ts',
  '../digits.ts',
  '../language.ts',
];

const SOURCES: Record<string, string> = import.meta.glob(
  [
    './**/*.ts',
    '!./**/*.test.ts',
    '../categories.ts',
    '../currencies.ts',
    '../digits.ts',
    '../language.ts',
  ],
  { eager: true, query: '?raw', import: 'default' },
);

const IMPORT_SPECIFIER =
  /\b(?:import|export)\s[^;]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"`]?([^'"`)]*)|\brequire\s*\(\s*['"`]?([^'"`)]*)/g;

const FORBIDDEN_API =
  /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|caches|document\.cookie)\b/;

/** Resolves a relative specifier written in `file` to a path like `./x.ts` or `../y.ts`. */
function resolve(file: string, specifier: string): string | undefined {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
    return undefined;
  }
  const parts = file.split('/').slice(0, -1);
  for (const part of specifier.split('/')) {
    if (part === '..') {
      if (parts.length === 0 || parts[parts.length - 1] === '..') {
        parts.push('..');
      } else if (parts[parts.length - 1] === '.') {
        parts.splice(-1, 1, '..');
      } else {
        parts.pop();
      }
    } else if (part !== '.') {
      parts.push(part);
    }
  }
  const joined = parts.join('/').replace(/\.js$/, '.ts');
  return joined.startsWith('.') ? joined : `./${joined}`;
}

/** Every problem in one source file: imports outside `allowed` and network or storage APIs. */
function violations(file: string, source: string, allowed: ReadonlySet<string>): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(IMPORT_SPECIFIER)) {
    const specifier = match.slice(1).find((group) => group !== undefined) ?? '';
    const target = resolve(file, specifier);
    if (target === undefined || !allowed.has(target)) {
      found.push(`${file} imports "${specifier}"`);
    }
  }
  const api = FORBIDDEN_API.exec(source);
  if (api !== null) {
    found.push(`${file} uses ${api[0]}`);
  }
  return found;
}

describe('NFR-008: the parser cannot reach the API client or storage', () => {
  const allowed = new Set(Object.keys(SOURCES));

  it('reads the parser sources it guards', () => {
    expect(Object.keys(SOURCES)).toEqual(expect.arrayContaining(['./utterance.ts', './index.ts']));
    expect(Object.keys(SOURCES)).toEqual(expect.arrayContaining(ALLOWED_CORE_MODULES));
    expect(Object.keys(SOURCES).some((file) => file.endsWith('.test.ts'))).toBe(false);
  });

  it('parser_module_does_not_import_api_client_or_storage', () => {
    const found = Object.entries(SOURCES).flatMap(([file, source]) =>
      violations(file, source, allowed),
    );
    expect(found).toEqual([]);
  });

  it('the guard catches a forbidden import or API (self-test)', () => {
    const bad = [
      "import { api } from '../../../apps/web/src/api/client.js';",
      "import { createClient } from 'some-http-library';",
      "export * from '../storage.js';",
      "import 'side-effect';",
      "const m = await import('../db.js');",
      "const f = require('node:fs');",
      'await fetch(url);',
      'localStorage.setItem(key, value);',
      'indexedDB.open(name);',
    ];
    for (const source of bad) {
      expect(violations('./utterance.ts', source, allowed), source).not.toEqual([]);
    }
    expect(
      violations('./utterance.ts', "import { normalize } from './normalize.js';", allowed),
    ).toEqual([]);
    expect(
      violations(
        './lexicon/categories.ts',
        "import type { X } from '../../categories.js';",
        allowed,
      ),
    ).toEqual([]);
  });
});
