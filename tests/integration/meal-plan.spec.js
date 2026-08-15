const { test, expect } = require('@playwright/test');
const { registerUser, authHeaders } = require('./_helpers');

test.describe('Meal plan', () => {
  test('rejects unauthenticated GET', async ({ request }) => {
    const res = await request.get('meal-plan');
    expect(res.status()).toBe(401);
  });

  test('returns null for a user with no saved plan yet', async ({ request }) => {
    const { token } = await registerUser(request);
    const res = await request.get('meal-plan', { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
    expect(await res.json()).toBeNull();
  });

  test('saves a meal plan and returns it', async ({ request }) => {
    const { token } = await registerUser(request);
    const payload = {
      plan: { Mon: { Breakfast: { title: 'Halwa Puri' } } },
      cuisines: ['Pakistani'],
      diet: 'None',
    };
    const res = await request.post('meal-plan', { headers: authHeaders(token), data: payload });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.cuisines).toEqual(['Pakistani']);
    expect(body.diet).toBe('None');
    expect(body.plan.Mon.Breakfast.title).toBe('Halwa Puri');
  });

  test('persists the plan across a subsequent GET', async ({ request }) => {
    const { token } = await registerUser(request);
    const payload = { plan: { Tue: { Lunch: { title: 'Biryani' } } }, cuisines: ['Indian'], diet: 'Vegan' };
    await request.post('meal-plan', { headers: authHeaders(token), data: payload });

    const res = await request.get('meal-plan', { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.diet).toBe('Vegan');
    expect(body.plan.Tue.Lunch.title).toBe('Biryani');
  });

  test('upserts on repeated POST instead of creating duplicates', async ({ request }) => {
    const { token } = await registerUser(request);
    await request.post('meal-plan', {
      headers: authHeaders(token),
      data: { plan: { Mon: {} }, cuisines: ['Pakistani'], diet: 'None' },
    });
    const second = await request.post('meal-plan', {
      headers: authHeaders(token),
      data: { plan: { Mon: {} }, cuisines: ['French'], diet: 'Vegetarian' },
    });
    expect(second.status()).toBe(200);
    const body = await second.json();
    expect(body.cuisines).toEqual(['French']);

    const getRes = await request.get('meal-plan', { headers: authHeaders(token) });
    const getBody = await getRes.json();
    expect(getBody.cuisines).toEqual(['French']); // only the latest plan should exist
  });

  test('rejects saving a meal plan with no plan field', async ({ request }) => {
    // EXPECTED (spec): the MealPlan schema marks `plan` as required, so
    // omitting it should be a 400 validation error.
    const { token } = await registerUser(request);
    const res = await request.post('meal-plan', {
      headers: authHeaders(token),
      data: { cuisines: ['Pakistani'], diet: 'None' },
    });
    expect(res.status()).toBe(400);
  });
});
