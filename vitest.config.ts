import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Tests run before the build (see .github/workflows/ci.yml), so workspaces that import
    // @masareef/core are tested against its sources rather than its build output.
    alias: {
      '@masareef/core': '/packages/core/src/index.ts',
      '@masareef/api-types': '/packages/api-types/src/index.ts',
    },
  },
  test: {
    include: [
      'packages/*/src/**/*.test.ts',
      'apps/*/src/**/*.test.{ts,tsx}',
      // The end-to-end harness's own logic (the Playwright specs are *.spec.ts: npm run e2e).
      'apps/web/e2e/**/*.test.ts',
      'poc/*/src/**/*.test.ts',
      'scripts/**/*.test.js',
    ],
    // apps/api runs in the Workers runtime with its own configuration, coverage provider and
    // 80% threshold: `npm run test:integration` (see apps/api/vitest.config.ts).
    exclude: [...configDefaults.exclude, 'apps/api/**'],
    // Makes the global localStorage and sessionStorage fail in every test on every Node version
    // (Node 25+ has its own, unusable without a flag); tests inject their own Storage.
    setupFiles: ['apps/web/src/testing/no-global-storage.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts', 'apps/*/src/**/*.{ts,tsx}', 'poc/*/src/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', 'apps/api/**', 'apps/*/src/testing/**'],
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: {
        lines: 80,
      },
    },
  },
});
