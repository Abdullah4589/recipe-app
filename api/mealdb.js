// TheMealDB — free, no API key, no daily limit
// https://www.themealdb.com/api.php
const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

// In-session pool cache to minimise calls
const poolCache = {};

// App cuisine → TheMealDB area name
const AREA_MAP = {
  Pakistani:       'Indian',     // closest in the DB; badge stays "Pakistani"
  Indian:          'Indian',
  Arabic:          'Egyptian',   // Egypt is Arab; also covers Moroccan overlap
  Italian:         'Italian',
  Mexican:         'Mexican',
  Mediterranean:   'Greek',
  Chinese:         'Chinese',
  Japanese:        'Japanese',
  American:        'American',
  'Middle Eastern':'Moroccan',
  Thai:            'Thai',
  French:          'French',
  Greek:           'Greek',
};

// Dietary preference → TheMealDB category (only Vegetarian/Vegan are supported)
const DIET_CAT = { Vegetarian: 'Vegetarian', Vegan: 'Vegan' };

// ─── helpers ────────────────────────────────────────────────────────────────

function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .trim();
}

async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MealDB error ${res.status}`);
  return res.json();
}

async function fetchAreaPool(area) {
  const key = `area:${area}`;
  if (poolCache[key]) return poolCache[key];
  const data = await apiFetch(`${BASE_URL}/filter.php?a=${encodeURIComponent(area)}`);
  poolCache[key] = data.meals || [];
  return poolCache[key];
}

async function fetchCategoryPool(category) {
  const key = `cat:${category}`;
  if (poolCache[key]) return poolCache[key];
  const data = await apiFetch(`${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
  poolCache[key] = data.meals || [];
  return poolCache[key];
}

async function fetchMealDetail(id) {
  const data = await apiFetch(`${BASE_URL}/lookup.php?i=${id}`);
  return data.meals?.[0] ?? null;
}

// Returns a pool of stubs based on cuisine + mealType + diet
async function getPool(cuisine, mealType, diet) {
  // Vegetarian / Vegan: use category pool, ignoring area
  if (DIET_CAT[diet]) {
    if (mealType === 'breakfast') return fetchCategoryPool('Breakfast');
    return fetchCategoryPool(DIET_CAT[diet]);
  }

  // Breakfast: use the Breakfast category
  if (mealType === 'breakfast') {
    const pool = await fetchCategoryPool('Breakfast');
    if (pool.length >= 5) return pool;
    // fallback to area if breakfast pool is tiny
  }

  // Main courses: filter by area
  const area = AREA_MAP[cuisine] || cuisine;
  const pool = await fetchAreaPool(area);
  if (pool.length) return pool;

  // Last resort fallback
  return fetchAreaPool('Italian');
}

function pickRandom(arr, exclude = new Set()) {
  const candidates = arr.filter(r => !exclude.has(String(r.idMeal)));
  if (!candidates.length) return arr[Math.floor(Math.random() * arr.length)] ?? null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ─── normalise ──────────────────────────────────────────────────────────────

function parseIngredients(meal) {
  const result = [];
  for (let i = 1; i <= 20; i++) {
    const name    = stripHtml(meal[`strIngredient${i}`] || '');
    const measure = stripHtml(meal[`strMeasure${i}`]    || '');
    if (name) {
      result.push({
        id:          i,
        displayText: [measure, name].filter(Boolean).join(' '),
        name,
        amount:      null,
        unit:        measure,
      });
    }
  }
  return result;
}

function parseSteps(text) {
  if (!text) return [];
  const cleaned = stripHtml(text);

  // TheMealDB often separates steps with \r\n
  const byLines = cleaned
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  if (byLines.length >= 3) {
    return byLines.map((step, i) => ({ number: i + 1, step }));
  }

  // Fallback: split on sentence boundaries
  const bySentence = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  return bySentence.map((step, i) => ({ number: i + 1, step }));
}

function normalizeRecipe(meal, displayCuisine) {
  const diets = [];
  if (meal.strCategory === 'Vegetarian') diets.push('vegetarian');
  if (meal.strCategory === 'Vegan')      diets.push('vegan');

  const sourceUrl =
    [meal.strSource, meal.strYoutube].find(u => u && u.startsWith('http')) || null;

  return {
    id:             String(meal.idMeal),
    title:          stripHtml(meal.strMeal),
    image:          meal.strMealThumb || null,
    readyInMinutes: null,
    servings:       null,
    cuisine:        displayCuisine || meal.strArea || 'International',
    diets,
    sourceUrl,
    ingredients:    parseIngredients(meal),
    steps:          parseSteps(meal.strInstructions),
  };
}

// ─── public API ─────────────────────────────────────────────────────────────

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS = ['Breakfast', 'Lunch', 'Dinner'];
const SLOT_TYPE = { Breakfast: 'breakfast', Lunch: 'main course', Dinner: 'main course' };

export async function generateWeekPlan(selectedCuisines, diet) {
  // Clear session pool cache for a fresh plan
  Object.keys(poolCache).forEach(k => delete poolCache[k]);

  const used = new Set();
  const week = {};

  for (const day of DAYS) {
    week[day] = {};
    const shuffled = [...selectedCuisines].sort(() => Math.random() - 0.5);
    const lunchCuisine  = shuffled[0];
    const dinnerCuisine = shuffled.length > 1 ? shuffled[1] : shuffled[0];

    const assignments = {
      Breakfast: { cuisine: shuffled[Math.floor(Math.random() * shuffled.length)], mealType: 'breakfast' },
      Lunch:     { cuisine: lunchCuisine,  mealType: 'main course' },
      Dinner:    { cuisine: dinnerCuisine, mealType: 'main course' },
    };

    for (const mealLabel of MEALS) {
      const { cuisine, mealType } = assignments[mealLabel];
      const pool = await getPool(cuisine, mealType, diet);
      const stub = pickRandom(pool, used);

      if (!stub) { week[day][mealLabel] = null; continue; }
      used.add(String(stub.idMeal));

      const detail = await fetchMealDetail(stub.idMeal);
      week[day][mealLabel] = detail ? normalizeRecipe(detail, cuisine) : null;
    }
  }

  return week;
}

export async function shuffleSingleMeal(cuisine, mealType, diet, excludeIds = []) {
  const pool     = await getPool(cuisine, mealType, diet);
  const excluded = new Set(excludeIds.map(String));
  const stub     = pickRandom(pool, excluded);
  if (!stub) return null;
  const detail = await fetchMealDetail(stub.idMeal);
  return detail ? normalizeRecipe(detail, cuisine) : null;
}
