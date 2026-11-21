/**
 * Runs before every unit test file (vitest.config.ts, `setupFiles`).
 *
 * Node 25 and later define their own `localStorage` and `sessionStorage` on `globalThis`, which
 * are unusable without `--localstorage-file`. Vitest's DOM environments do not replace a global
 * that already exists (only a fixed list of keys, which does not include these), and they make
 * `window` the global object, so under Node 26 `window.localStorage` in a test was Node's, not
 * happy-dom's, and every test that used it failed; under Node 22 the same tests passed.
 *
 * So the outcome no longer depends on the Node version: tests use Storage objects they create
 * (testing/storage.ts), and any test that reaches for the global storage fails here, on every
 * Node version, with a message saying what to do. Code under test that guards its storage access,
 * as the web app does, sees the same failure a browser with blocked site data would give.
 */
for (const name of ['localStorage', 'sessionStorage'] as const) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: true,
    get(): never {
      throw new DOMException(
        `Tests must not use the global ${name}, whose behaviour depends on the Node version: ` +
          'pass a Storage from apps/web/src/testing/storage.ts instead.',
        'SecurityError',
      );
    },
  });
}
