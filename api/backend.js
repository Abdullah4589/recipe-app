// Replace with your computer's local IP when testing on phone (e.g. http://192.168.1.5:3000/api)
// Replace with your deployed server URL when in production
export const BACKEND_URL = 'https://recipe-app-backend-production-4bea.up.railway.app/api';

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
