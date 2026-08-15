// Shared helpers for the browser e2e suite.
//
// These drive the real Expo web build (react-native-web) against the same
// disposable in-memory backend the integration tests use.
//
// One react-native-web fact shapes everything here: `testID` renders as
// `data-testid`, which is exactly what Playwright's getByTestId() looks for.
// So the app's test hooks and the test selectors line up with no config.

const { expect } = require('@playwright/test');

// The app plays a ~2.5s splash animation before mounting the navigator, so
// nothing is interactive on first paint. Every entry point waits this out.
const SPLASH_MS = 4000;

function uniqueEmail(tag = 'e2e') {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${tag}.${Date.now()}.${rand}@example.test`;
}

// Loads the app and waits until the login form is interactive.
async function openApp(page) {
  await page.goto('/');
  await expect(page.getByTestId('login-card')).toBeVisible({ timeout: SPLASH_MS + 20_000 });
}

// Registers a brand-new user through the UI and lands on the home screen.
// Returns the credentials so a test can log back in as the same user.
async function registerViaUI(page, { email = uniqueEmail(), password = 'Password123!' } = {}) {
  await openApp(page);
  await page.getByTestId('go-to-register').click();

  await expect(page.getByTestId('register-card')).toBeVisible();
  await page.getByTestId('register-email').fill(email);
  await page.getByTestId('register-password').fill(password);
  await page.getByTestId('register-confirm').fill(password);
  await page.getByTestId('register-submit').click();

  // Reaching the home screen is the proof that registration succeeded: the
  // navigator only renders it once AuthContext holds a user.
  await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 30_000 });

  return { email, password };
}

async function loginViaUI(page, { email, password }) {
  await openApp(page);
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

// Taps the back button *on a named screen*.
//
// React Navigation keeps previous screens mounted in the DOM rather than
// unmounting them, so a bare getByTestId('back-button') matches every screen
// on the stack and trips Playwright's strict mode. Any control whose testID
// repeats across screens has to be scoped to its screen container.
async function tapBackOn(page, screenTestId) {
  await page.getByTestId(screenTestId).getByTestId('back-button').click();
}

// Where the disposable test backend lives. e2e tests use the web server as
// their baseURL, so any direct API assertion needs the absolute URL.
const API_BASE = `http://localhost:${process.env.TEST_BACKEND_PORT || 4000}/api/`;

// Reads the JWT that AuthContext persisted, so a test can verify server-side
// state directly instead of inferring it from the UI.
//
// AsyncStorage's web backend writes to localStorage, but whether it prefixes
// the key is an implementation detail we should not depend on — so match the
// key by suffix rather than assuming it is exactly '@auth_user'.
async function tokenFrom(page) {
  return page.evaluate(() => {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.endsWith('@auth_user')) continue;
      try {
        const parsed = JSON.parse(window.localStorage.getItem(key));
        if (parsed?.token) return parsed.token;
      } catch (_e) { /* not the entry we're after */ }
    }
    return null;
  });
}

module.exports = {
  uniqueEmail, openApp, registerViaUI, loginViaUI, tapBackOn, tokenFrom,
  API_BASE, SPLASH_MS,
};
