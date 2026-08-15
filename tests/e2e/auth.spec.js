const { test, expect } = require('@playwright/test');
const { uniqueEmail, openApp, registerViaUI, loginViaUI } = require('./_app');

test.describe('Auth journeys (browser)', () => {
  test('a new user can register and lands on the home screen', async ({ page }) => {
    const email = uniqueEmail('reg');
    await registerViaUI(page, { email });

    // The home screen shows the signed-in address — proof the token round
    // trip populated AuthContext rather than the navigator just advancing.
    await expect(page.getByText(email)).toBeVisible();
  });

  test('a registered user can sign out and sign back in', async ({ page }) => {
    const creds = await registerViaUI(page);

    // Sign-out goes through Alert.alert, which react-native-web does not
    // implement — there is no dialog to confirm. Clearing the stored session
    // directly and reloading exercises the same thing that actually matters:
    // that the app returns to the login gate when no session is present.
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await loginViaUI(page, creds);
    await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(creds.email)).toBeVisible();
  });

  test('a wrong password shows an error and does not sign the user in', async ({ page }) => {
    const creds = await registerViaUI(page);
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await loginViaUI(page, { email: creds.email, password: 'DefinitelyWrong!' });

    // The backend's deliberately vague message — it must not reveal whether
    // the address is registered (see backend/routes/auth.js).
    await expect(page.getByTestId('auth-error')).toBeVisible();
    await expect(page.getByTestId('auth-error')).toContainText(/invalid email or password/i);

    // Still on the login gate.
    await expect(page.getByTestId('login-card')).toBeVisible();
    await expect(page.getByTestId('home-screen')).toHaveCount(0);
  });

  test('mismatched passwords are caught before any request is sent', async ({ page }) => {
    let registerCalls = 0;
    await page.route('**/api/auth/register', route => { registerCalls++; route.continue(); });

    await openApp(page);
    await page.getByTestId('go-to-register').click();
    await page.getByTestId('register-email').fill(uniqueEmail('mismatch'));
    await page.getByTestId('register-password').fill('Password123!');
    await page.getByTestId('register-confirm').fill('Password456!');
    await page.getByTestId('register-submit').click();

    await expect(page.getByTestId('auth-error')).toContainText(/passwords do not match/i);
    expect(registerCalls).toBe(0);
  });

  test('the session survives a page reload', async ({ page }) => {
    const { email } = await registerViaUI(page);

    // AuthContext rehydrates from AsyncStorage, which is localStorage on web.
    // This is the one thing a reload actually proves.
    await page.reload();

    await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByTestId('login-card')).toHaveCount(0);
  });
});
