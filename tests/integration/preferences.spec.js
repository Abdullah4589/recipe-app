const { test, expect } = require('@playwright/test');
const { registerUser, authHeaders } = require('./_helpers');

test.describe('Preferences', () => {
  test('rejects unauthenticated GET', async ({ request }) => {
    const res = await request.get('preferences');
    expect(res.status()).toBe(401);
  });

  test('returns null for a new user', async ({ request }) => {
    const { token } = await registerUser(request);
    const res = await request.get('preferences', { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
    expect(await res.json()).toBeNull();
  });

  test('saves preferences', async ({ request }) => {
    const { token } = await registerUser(request);
    const res = await request.put('preferences', {
      headers: authHeaders(token),
      data: { cuisines: ['Italian', 'Thai'], diet: 'Vegetarian' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.cuisines).toEqual(['Italian', 'Thai']);
    expect(body.diet).toBe('Vegetarian');
  });

  test('persists preferences across GET', async ({ request }) => {
    const { token } = await registerUser(request);
    await request.put('preferences', { headers: authHeaders(token), data: { cuisines: ['French'], diet: 'Vegan' } });
    const res = await request.get('preferences', { headers: authHeaders(token) });
    const body = await res.json();
    expect(body.cuisines).toEqual(['French']);
    expect(body.diet).toBe('Vegan');
  });

  test('upserts preferences on repeated PUT (single doc per user)', async ({ request }) => {
    const { token } = await registerUser(request);
    await request.put('preferences', { headers: authHeaders(token), data: { cuisines: ['Mexican'], diet: 'None' } });
    await request.put('preferences', { headers: authHeaders(token), data: { cuisines: ['Japanese'], diet: 'High Protein' } });

    const res = await request.get('preferences', { headers: authHeaders(token) });
    const body = await res.json();
    expect(body.cuisines).toEqual(['Japanese']);
    expect(body.diet).toBe('High Protein');
  });
});
