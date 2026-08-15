const { test, expect } = require('@playwright/test');
const jwt = require('jsonwebtoken');

test.describe('Auth middleware', () => {
  test('rejects a protected route with no Authorization header', async ({ request }) => {
    const res = await request.get('favourites');
    expect(res.status()).toBe(401);
  });

  test('rejects a protected route with a malformed Authorization header (no Bearer prefix)', async ({ request }) => {
    const res = await request.get('favourites', { headers: { Authorization: 'sometoken' } });
    expect(res.status()).toBe(401);
  });

  test('rejects a protected route with a garbage token', async ({ request }) => {
    const res = await request.get('favourites', { headers: { Authorization: 'Bearer not-a-real-jwt' } });
    expect(res.status()).toBe(401);
  });

  test('rejects a token signed with the wrong secret', async ({ request }) => {
    const forged = jwt.sign({ id: '507f1f77bcf86cd799439011' }, 'wrong-secret', { expiresIn: '1h' });
    const res = await request.get('favourites', { headers: { Authorization: `Bearer ${forged}` } });
    expect(res.status()).toBe(401);
  });
});
