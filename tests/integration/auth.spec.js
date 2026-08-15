const { test, expect } = require('@playwright/test');
const { uniqueEmail, registerUser } = require('./_helpers');

test.describe('Auth — register', () => {
  test('registers a new user and returns a token', async ({ request }) => {
    const email = uniqueEmail('register');
    const res = await request.post('auth/register', { data: { email, password: 'Password123!' } });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('token');
    expect(body).toHaveProperty('userId');
    expect(body.email).toBe(email);
  });

  test('rejects duplicate email registration', async ({ request }) => {
    const email = uniqueEmail('dup');
    await registerUser(request, { email });
    const res = await request.post('auth/register', { data: { email, password: 'Password123!' } });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toMatch(/already registered/i);
  });

  test('rejects registration missing email', async ({ request }) => {
    const res = await request.post('auth/register', { data: { password: 'Password123!' } });
    expect(res.status()).toBe(400);
  });

  test('rejects registration missing password', async ({ request }) => {
    const res = await request.post('auth/register', { data: { email: uniqueEmail('nopass') } });
    expect(res.status()).toBe(400);
  });

  test('rejects registration with an invalid email format', async ({ request }) => {
    // EXPECTED (spec): the API should reject obviously malformed addresses.
    const res = await request.post('auth/register', {
      data: { email: 'not-an-email', password: 'Password123!' },
    });
    expect(res.status()).toBe(400);
  });

  test('rejects registration with a weak/too-short password', async ({ request }) => {
    // EXPECTED (spec): server-side password policy should mirror the
    // client-side "min 6 characters" rule enforced in RegisterScreen.js.
    const res = await request.post('auth/register', {
      data: { email: uniqueEmail('weak'), password: '1' },
    });
    expect(res.status()).toBe(400);
  });

  test('trims and lowercases email on save', async ({ request }) => {
    const rawEmail = `  MixedCase.${Date.now()}@Example.com  `;
    const password = 'Password123!';
    const regRes = await request.post('auth/register', { data: { email: rawEmail, password } });
    expect(regRes.status()).toBe(201);

    const loginRes = await request.post('auth/login', {
      data: { email: rawEmail.trim().toLowerCase(), password },
    });
    expect(loginRes.status()).toBe(200);
  });
});

test.describe('Auth — login', () => {
  test('logs in with correct credentials', async ({ request }) => {
    const email = uniqueEmail('login');
    const password = 'Password123!';
    await registerUser(request, { email, password });

    const res = await request.post('auth/login', { data: { email, password } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('token');
    expect(body.email).toBe(email);
  });

  test('rejects login with wrong password', async ({ request }) => {
    const email = uniqueEmail('wrongpass');
    await registerUser(request, { email, password: 'Password123!' });

    const res = await request.post('auth/login', { data: { email, password: 'WrongPassword!' } });
    expect(res.status()).toBe(401);
  });

  test('rejects login for a nonexistent email', async ({ request }) => {
    const res = await request.post('auth/login', {
      data: { email: uniqueEmail('ghost'), password: 'Password123!' },
    });
    expect(res.status()).toBe(401);
  });

  test('handles login with a missing password field gracefully', async ({ request }) => {
    // EXPECTED (spec): missing input should be a client error (400/401),
    // not an unhandled server error.
    const email = uniqueEmail('missingpass');
    await registerUser(request, { email });

    const res = await request.post('auth/login', { data: { email } });
    expect([400, 401]).toContain(res.status());
  });
});
