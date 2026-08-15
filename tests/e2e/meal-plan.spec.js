const { test, expect } = require('@playwright/test');
const { registerViaUI, tapBackOn, tokenFrom, API_BASE } = require('./_app');

// The core journey: pick preferences, generate a week, open a meal, favourite
// it, and confirm it survived to the server. Every step here crosses the
// UI -> api/backend.js -> Express -> Mongo boundary, which is precisely what
// the integration tier cannot prove on its own.
test.describe('Meal plan journey (browser)', () => {
  test('picks cuisines and a diet, generates a week, and shows meals', async ({ page }) => {
    await registerViaUI(page);

    // Pakistani is on by default; add Italian and switch to Vegetarian.
    await page.getByTestId('cuisine-chip-Italian').click();
    await page.getByTestId('diet-chip-Vegetarian').click();

    // Selection is asserted through the accessible name, not aria-selected:
    // react-native-web omits aria-selected on role="button" because ARIA does
    // not permit it there. Asserting the label also means the test fails if
    // the state stops being announced to screen readers.
    await expect(page.getByTestId('diet-chip-Vegetarian'))
      .toHaveAttribute('aria-label', /selected/i);

    await page.getByTestId('plan-my-week').click();

    await expect(page.getByTestId('weekly-plan-screen')).toBeVisible();

    // Generation fans out a lot of TheMealDB lookups behind a rate-limit
    // delay, so this is the slow step in the whole suite.
    await expect(page.getByTestId('meal-card-Breakfast')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('meal-card-Lunch')).toBeVisible();
    await expect(page.getByTestId('meal-card-Dinner')).toBeVisible();

    // Whatever the API returned, no slot may be empty — that is the promise
    // the stubRecipe() fallback exists to keep (docs/DECISIONS.md ADR-005).
    for (const meal of ['Breakfast', 'Lunch', 'Dinner']) {
      await expect(page.getByTestId(`meal-title-${meal}`)).not.toBeEmpty();
    }
  });

  test('persists the generated plan to the server across a fresh session', async ({ page }) => {
    const creds = await registerViaUI(page);

    await page.getByTestId('plan-my-week').click();
    await expect(page.getByTestId('meal-card-Breakfast')).toBeVisible({ timeout: 90_000 });
    const original = await page.getByTestId('meal-title-Breakfast').innerText();

    // Wait for the plan to reach the server before throwing the session away
    // — the save is fire-and-forget from the UI's point of view.
    const token = await tokenFrom(page);
    expect(token, 'no session token in storage').toBeTruthy();

    await expect.poll(
      async () => {
        // Absolute URL on purpose: baseURL for this project is the web
        // server, not the API.
        const res = await page.request.get(`${API_BASE}meal-plan`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok() && (await res.json())?.plan != null;
      },
      { timeout: 30_000, message: 'plan never reached the backend' }
    ).toBe(true);

    // Clear local state entirely: the plan can now only come from the cloud.
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await page.getByTestId('login-email').fill(creds.email);
    await page.getByTestId('login-password').fill(creds.password);
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('plan-my-week').click();
    await expect(page.getByTestId('meal-card-Breakfast')).toBeVisible({ timeout: 90_000 });
    await expect(page.getByTestId('meal-title-Breakfast')).toHaveText(original);
  });

  test('favouriting a recipe stores it and it appears on the favourites screen', async ({ page }) => {
    await registerViaUI(page);

    await page.getByTestId('plan-my-week').click();
    await expect(page.getByTestId('meal-card-Breakfast')).toBeVisible({ timeout: 90_000 });

    const title = await page.getByTestId('meal-title-Breakfast').innerText();
    await page.getByTestId('meal-card-Breakfast').click();

    await expect(page.getByTestId('recipe-detail-screen')).toBeVisible();
    await page.getByTestId('favourite-toggle').click();

    // The heart flips to saved only after the POST resolves. Asserted via the
    // accessible name for the same reason as the diet chip above.
    await expect(page.getByTestId('favourite-toggle'))
      .toHaveAttribute('aria-label', 'Saved to favourites');

    // Back out through the app's own buttons, not page.goBack(): the
    // navigator has no `linking` config, so React Navigation state is not
    // mirrored into browser history and a browser-level back would leave the
    // app entirely. Scoped per screen because the stack stays mounted — see
    // tapBackOn in _app.js.
    await tapBackOn(page, 'recipe-detail-screen');
    await expect(page.getByTestId('weekly-plan-screen')).toBeVisible();
    await tapBackOn(page, 'weekly-plan-screen');
    await expect(page.getByTestId('home-screen')).toBeVisible();

    await page.getByTestId('nav-favourites').click();
    await expect(page.getByTestId('favourites-screen')).toBeVisible();
    await expect(page.getByTestId('favourite-row')).toHaveCount(1);
    await expect(page.getByTestId('favourite-row')).toContainText(title);
  });
});
