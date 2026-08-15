// Which backend this build talks to.
//
// Set EXPO_PUBLIC_BACKEND_URL to override (Expo inlines EXPO_PUBLIC_* at bundle
// time, so this is a build-time constant, not a runtime lookup):
//   - local dev on a phone: http://<your-LAN-IP>:3000/api  (never `localhost`,
//     the phone can't reach the dev machine's loopback)
//   - e2e test runs:        http://localhost:4000/api      (the disposable
//     in-memory backend from backend/test-server.js)
//
// Falling back to the deployed URL keeps `npx expo start` working with no .env.
// This indirection is what makes browser e2e possible at all — see
// docs/DECISIONS.md ADR-006.
export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  'https://recipe-app-backend-production-4bea.up.railway.app/api';

let _token = null;

export function setAuthToken(token) {
  _token = token;
}

export function getAuthToken() {
  return _token;
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (email, password) =>
    request('POST', '/auth/register', { email, password }),

  login: (email, password) =>
    request('POST', '/auth/login', { email, password }),
};

// ─── Meal Plan ────────────────────────────────────────────────────────────────
export const mealPlanAPI = {
  get: () =>
    request('GET', '/meal-plan'),

  save: (plan, cuisines, diet) =>
    request('POST', '/meal-plan', { plan, cuisines, diet }),
};

// ─── Favourites ───────────────────────────────────────────────────────────────
export const favouritesAPI = {
  getAll: () =>
    request('GET', '/favourites'),

  add: (recipe) =>
    request('POST', '/favourites', { recipe }),

  remove: (id) =>
    request('DELETE', `/favourites/${id}`),
};

// ─── Custom Recipes ───────────────────────────────────────────────────────────
export const customRecipesAPI = {
  getAll: () =>
    request('GET', '/custom-recipes'),

  create: (recipe) =>
    request('POST', '/custom-recipes', recipe),

  update: (id, recipe) =>
    request('PUT', `/custom-recipes/${id}`, recipe),

  remove: (id) =>
    request('DELETE', `/custom-recipes/${id}`),
};

// ─── Preferences ──────────────────────────────────────────────────────────────
export const preferencesAPI = {
  get: () =>
    request('GET', '/preferences'),

  save: (cuisines, diet) =>
    request('PUT', '/preferences', { cuisines, diet }),
};
