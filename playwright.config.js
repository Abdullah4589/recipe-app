// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const TEST_BACKEND_PORT = Number(process.env.TEST_BACKEND_PORT || 4000);
const WEB_PORT          = Number(process.env.E2E_WEB_PORT || 4173);

const API_BASE = `http://localhost:${TEST_BACKEND_PORT}/api/`;
const WEB_BASE = `http://localhost:${WEB_PORT}`;

// Playwright starts every entry in `webServer` regardless of which projects
// are selected, so an integration-only run would otherwise pay for a full
// Expo web export it never uses (~1-2 min). Only start the web server when
// the e2e project is actually in play.
//
// PW_WEB=1/0 forces it either way; otherwise infer from --project on argv,
// which the CLI has already parsed into this process before loading the
// config. Inferring beats requiring a cross-platform env-var shim in
// package.json just to set one flag.
const selectedProjects = process.argv
  .flatMap((arg, i) =>
    arg === '--project' ? [process.argv[i + 1]]
      : arg.startsWith('--project=') ? [arg.slice('--project='.length)]
        : []
  )
  .filter(Boolean);

const RUN_WEB_SERVER = process.env.PW_WEB === '1' ? true
  : process.env.PW_WEB === '0' ? false
    : selectedProjects.length === 0 || selectedProjects.includes('e2e');

// Two tiers, one config (see docs/DECISIONS.md ADR-007):
//
//   integration — drives the real Express app over HTTP, no browser. Fast,
//                 covers the whole API surface including things the UI can't
//                 reach (malformed tokens, cross-user access).
//   e2e         — drives the real UI in Chromium via react-native-web. Slow,
//                 covers the handful of journeys that must never break.
//
// Both run against backend/test-server.js: the real app on a throwaway
// in-memory MongoDB. Neither touches the deployed Railway backend.
module.exports = defineConfig({
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],

  projects: [
    {
      name: 'integration',
      testDir: './tests/integration',
      timeout: 30_000,
      use: {
        baseURL: API_BASE,
        extraHTTPHeaders: { 'Content-Type': 'application/json' },
        trace: 'retain-on-failure',
      },
    },
    {
      name: 'e2e',
      testDir: './tests/e2e',
      // Generous: these drive a real browser through a real network round
      // trip to a real database, and the meal-plan screen fans out a burst
      // of TheMealDB lookups behind a deliberate rate-limit delay.
      timeout: 120_000,
      expect: { timeout: 20_000 },
      use: {
        ...devices['Desktop Chrome'],
        baseURL: WEB_BASE,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 20_000,
        navigationTimeout: 60_000,
      },
    },
  ],

  webServer: [
    {
      command: 'node backend/test-server.js',
      url: `${API_BASE}health`,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
      env: { TEST_BACKEND_PORT: String(TEST_BACKEND_PORT) },
    },
    ...(RUN_WEB_SERVER ? [{
      // Builds the web bundle on first start, so allow for a cold export.
      command: 'node scripts/serve-web.js',
      url: WEB_BASE,
      reuseExistingServer: !process.env.CI,
      timeout: 600_000,
      stdout: /** @type {const} */ ('pipe'),
      env: {
        E2E_WEB_PORT: String(WEB_PORT),
        TEST_BACKEND_PORT: String(TEST_BACKEND_PORT),
        // Points the built app at the disposable test backend.
        EXPO_PUBLIC_BACKEND_URL: API_BASE.replace(/\/$/, ''),
      },
    }] : []),
  ],
});
