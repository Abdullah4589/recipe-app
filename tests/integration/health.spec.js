const { test, expect } = require('@playwright/test');

test.describe('Health', () => {
  test('GET /health returns 200 status ok', async ({ request }) => {
    const res = await request.get('health');
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});
