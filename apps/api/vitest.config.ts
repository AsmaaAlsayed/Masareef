import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Runs inside workerd with a local D1 database, so it is separate from the root configuration:
// the Workers runtime does not support V8 coverage, and a Vitest run has one coverage provider.
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        bindings: { RELEASE: 'test-release' },
        // A small stand-in for apps/web/dist, so these tests do not depend on the web build.
        // The other asset settings (binding, run_worker_first, fallback) come from wrangler.jsonc.
        assets: { directory: './test-assets' },
      },
    }),
  ],
  resolve: {
    // Tests run before the build (see .github/workflows/ci.yml), so @masareef/core is loaded from
    // its sources, as in the root configuration and in wrangler.jsonc's `alias`.
    alias: {
      '@masareef/core': fileURLToPath(
        new URL('../../packages/core/src/index.ts', import.meta.url).href,
      ),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: {
        lines: 80,
      },
    },
  },
});
