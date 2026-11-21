/**
 * End-to-end, accessibility and screenshot harness (T-018): the real Worker serving the real web
 * build, started by `wrangler dev` in local mode, driven in Chromium, Firefox and WebKit at the
 * narrowest and widest supported widths (NFR-026: 320 to 1,920 CSS pixels).
 *
 * The web build must exist (`npm run build`): this configuration builds nothing.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';
import { E2E_RELEASE } from './screens.js';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

if (!existsSync(here('../dist/index.html'))) {
  throw new Error('apps/web/dist/index.html is missing: run `npm run build` before `npm run e2e`.');
}

/** Fixed, and not wrangler's default 8787, so a running `npm run dev` does not collide with it. */
const PORT = 8790;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const ENGINES = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
} as const;

const WIDTHS = {
  320: { width: 320, height: 640 },
  1920: { width: 1920, height: 1080 },
} as const;

const onCi = process.env['CI'] !== undefined;

export default defineConfig({
  testDir: here('.'),
  testMatch: '**/*.spec.ts',
  outputDir: here('output/test-results'),
  fullyParallel: true,
  forbidOnly: onCi,
  // A flaky end-to-end test is a defect (testing standard 7), so nothing is retried.
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: here('output/report'), open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: Object.entries(ENGINES).flatMap(([engine, device]) =>
    Object.entries(WIDTHS).map(([width, viewport]) => ({
      name: `${engine}-${width}`,
      use: { ...device, viewport },
    })),
  ),
  webServer: {
    // The API Worker with the web build as its static assets (apps/api/wrangler.jsonc), local
    // mode only: no Cloudflare account and no remote bindings. Playwright stops it, and every
    // process it started, by process id when the run ends.
    command: [
      'node ../../node_modules/wrangler/bin/wrangler.js dev',
      '--local',
      `--ip 127.0.0.1 --port ${PORT}`,
      `--var RELEASE:${E2E_RELEASE}`,
      // Its own local database, apart from the one `npm run dev` uses.
      '--persist-to .wrangler/e2e',
      '--show-interactive-dev-session=false',
      '--log-level warn',
    ].join(' '),
    cwd: here('../../api'),
    url: `${BASE_URL}/api/v1/health/live`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { WRANGLER_SEND_METRICS: 'false', CLOUDFLARE_SEND_METRICS: 'false' },
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
