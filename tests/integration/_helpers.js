// Shared helpers for the API test suite. Every test run gets fresh,
// randomly-named users against the disposable local test backend
// (backend/test-server.js) — never production.

function uniqueEmail(tag = 'user') {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${tag}.${Date.now()}.${rand}@example.test`;
}

async function registerUser(request, { email, password = 'Password123!' } = {}) {
  const finalEmail = email || uniqueEmail();
  const res = await request.post('auth/register', {
    data: { email: finalEmail, password },
  });
  if (!res.ok()) {
    throw new Error(`registerUser failed: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return { email: finalEmail, password, ...body };
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { uniqueEmail, registerUser, authHeaders };
