import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Tests run before the build (see .github/workflows/ci.yml), so workspaces that import
    // @masareef/core are tested against its sources rather than its build output.
    alias: { '@masareef/core': '/packages/core/src/index.ts' },
  },
  test: {
    include: [
      'packages/*/src/**/*.test.ts',
      'apps/*/src/**/*.test.{ts,tsx}',
      'poc/*/src/**/*.test.ts',
      'scripts/**/*.test.js',
    ],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts', 'apps/*/src/**/*.{ts,tsx}', 'poc/*/src/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts'],
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: {
        lines: 80,
      },
    },
  },
});
