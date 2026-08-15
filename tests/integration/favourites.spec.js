const { test, expect } = require('@playwright/test');
const { registerUser, authHeaders } = require('./_helpers');

test.describe('Favourites', () => {
  test('rejects unauthenticated GET', async ({ request }) => {
    const res = await request.get('favourites');
    expect(res.status()).toBe(401);
  });

  test('returns an empty list for a new user', async ({ request }) => {
    const { token } = await registerUser(request);
    const res = await request.get('favourites', { headers: authHeaders(token) });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  test('adds a favourite recipe', async ({ request }) => {
    const { token } = await registerUser(request);
    const res = await request.post('favourites', {
      headers: authHeaders(token),
      data: { recipe: { id: '52772', title: 'Teriyaki Chicken Casserole' } },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.recipe.title).toBe('Teriyaki Chicken Casserole');
  });

  test('lists a previously-added favourite', async ({ request }) => {
    const { token } = await registerUser(request);
    await request.post('favourites', {
      headers: authHeaders(token),
      data: { recipe: { id: '1', title: 'Test Recipe' } },
    });
    const res = await request.get('favourites', { headers: authHeaders(token) });
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].recipe.title).toBe('Test Recipe');
  });

  test('rejects adding a favourite with no recipe field', async ({ request }) => {
    // EXPECTED (spec): missing required field -> 400, not a raw 500.
    const { token } = await registerUser(request);
    const res = await request.post('favourites', { headers: authHeaders(token), data: {} });
    expect(res.status()).toBe(400);
  });

  test('deletes an owned favourite', async ({ request }) => {
    const { token } = await registerUser(request);
    const created = await (await request.post('favourites', {
      headers: authHeaders(token),
      data: { recipe: { id: '2', title: 'Delete Me' } },
    })).json();

    const delRes = await request.delete(`favourites/${created._id}`, { headers: authHeaders(token) });
    expect(delRes.status()).toBe(200);
    expect((await delRes.json()).success).toBe(true);

    const listRes = await request.get('favourites', { headers: authHeaders(token) });
    expect(await listRes.json()).toEqual([]);
  });

  test('rejects deleting with a malformed id', async ({ request }) => {
    // EXPECTED (spec): an invalid ObjectId should be a 400, not a 500.
    const { token } = await registerUser(request);
    const res = await request.delete('favourites/not-a-valid-id', { headers: authHeaders(token) });
    expect(res.status()).toBe(400);
  });

  test("does not delete another user's favourite", async ({ request }) => {
    // EXPECTED (spec): attempting to delete a favourite you don't own
    // should report failure (404), not a false "success: true".
    const owner = await registerUser(request);
    const attacker = await registerUser(request);

    const created = await (await request.post('favourites', {
      headers: authHeaders(owner.token),
      data: { recipe: { id: '3', title: "Owner's Recipe" } },
    })).json();

    const delRes = await request.delete(`favourites/${created._id}`, { headers: authHeaders(attacker.token) });
    expect(delRes.status()).toBe(404);

    // and it must still exist for the real owner
    const listRes = await request.get('favourites', { headers: authHeaders(owner.token) });
    expect((await listRes.json()).length).toBe(1);
  });

  test('isolates favourites between users', async ({ request }) => {
    const userA = await registerUser(request);
    const userB = await registerUser(request);
    await request.post('favourites', { headers: authHeaders(userA.token), data: { recipe: { id: '9', title: 'A only' } } });

    const res = await request.get('favourites', { headers: authHeaders(userB.token) });
    expect(await res.json()).toEqual([]);
  });
});
