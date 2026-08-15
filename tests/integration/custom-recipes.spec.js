const { test, expect } = require('@playwright/test');
const { registerUser, authHeaders } = require('./_helpers');

test.describe('Custom recipes', () => {
  test('rejects unauthenticated GET', async ({ request }) => {
    const res = await request.get('custom-recipes');
    expect(res.status()).toBe(401);
  });

  test('returns an empty list for a new user', async ({ request }) => {
    const { token } = await registerUser(request);
    const res = await request.get('custom-recipes', { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test('creates a custom recipe', async ({ request }) => {
    const { token } = await registerUser(request);
    const res = await request.post('custom-recipes', {
      headers: authHeaders(token),
      data: { title: 'Grandma Soup', cuisine: 'American', servings: 6, ingredients: [], steps: [] },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.title).toBe('Grandma Soup');
    expect(body.servings).toBe(6);
  });

  test('rejects creating a custom recipe with no title', async ({ request }) => {
    // EXPECTED (spec): the model marks `title` required -> 400, not a raw 500.
    const { token } = await registerUser(request);
    const res = await request.post('custom-recipes', { headers: authHeaders(token), data: { cuisine: 'American' } });
    expect(res.status()).toBe(400);
  });

  test('lists a previously-created custom recipe', async ({ request }) => {
    const { token } = await registerUser(request);
    await request.post('custom-recipes', { headers: authHeaders(token), data: { title: 'Listed Recipe' } });
    const res = await request.get('custom-recipes', { headers: authHeaders(token) });
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].title).toBe('Listed Recipe');
  });

  test('updates an owned custom recipe', async ({ request }) => {
    const { token } = await registerUser(request);
    const created = await (await request.post('custom-recipes', {
      headers: authHeaders(token),
      data: { title: 'Original Title' },
    })).json();

    const res = await request.put(`custom-recipes/${created._id}`, {
      headers: authHeaders(token),
      data: { title: 'Updated Title' },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).title).toBe('Updated Title');
  });

  test('returns 404 updating a nonexistent custom recipe', async ({ request }) => {
    const { token } = await registerUser(request);
    const res = await request.put('custom-recipes/507f1f77bcf86cd799439011', {
      headers: authHeaders(token),
      data: { title: 'Nope' },
    });
    expect(res.status()).toBe(404);
  });

  test("returns 404 updating another user's custom recipe", async ({ request }) => {
    const owner = await registerUser(request);
    const attacker = await registerUser(request);
    const created = await (await request.post('custom-recipes', {
      headers: authHeaders(owner.token),
      data: { title: "Owner's Recipe" },
    })).json();

    const res = await request.put(`custom-recipes/${created._id}`, {
      headers: authHeaders(attacker.token),
      data: { title: 'Hijacked' },
    });
    expect(res.status()).toBe(404);
  });

  test('deletes an owned custom recipe', async ({ request }) => {
    const { token } = await registerUser(request);
    const created = await (await request.post('custom-recipes', {
      headers: authHeaders(token),
      data: { title: 'Delete Me' },
    })).json();

    const delRes = await request.delete(`custom-recipes/${created._id}`, { headers: authHeaders(token) });
    expect(delRes.status()).toBe(200);

    const listRes = await request.get('custom-recipes', { headers: authHeaders(token) });
    expect(await listRes.json()).toEqual([]);
  });

  test("does not delete another user's custom recipe", async ({ request }) => {
    // EXPECTED (spec): deleting a recipe you don't own should report
    // failure (404), not a false "success: true".
    const owner = await registerUser(request);
    const attacker = await registerUser(request);
    const created = await (await request.post('custom-recipes', {
      headers: authHeaders(owner.token),
      data: { title: "Owner's Recipe 2" },
    })).json();

    const delRes = await request.delete(`custom-recipes/${created._id}`, { headers: authHeaders(attacker.token) });
    expect(delRes.status()).toBe(404);

    const listRes = await request.get('custom-recipes', { headers: authHeaders(owner.token) });
    expect((await listRes.json()).length).toBe(1);
  });
});
