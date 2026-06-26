import Constants from 'expo-constants';

const BASE_URL = 'https://api.spoonacular.com';
const API_KEY = Constants.expoConfig?.extra?.spoonacularApiKey ?? '';

// In-session cache: key = `${cuisine}|${mealType}|${diet}` → array of recipe stubs
const poolCache = {};

function buildPoolKey(cuisine, mealType, diet) {
  return `${cuisine}|${mealType}|${diet || 'none'}`;
}

async function fetchPool(cuisine, mealType, diet) {
  const key = buildPoolKey(cuisine, mealType, diet);
  if (poolCache[key]) return poolCache[key];

  const params = new URLSearchParams({
    apiKey: API_KEY,
    type: mealType,
    number: '20',
    addRecipeInformation: 'false',
    fillIngredients: 'false',
  });
  if (cuisine) params.set('cuisine', cuisine);
  if (diet && diet !== 'None') {
    params.set('diet', diet.toLowerCase().replace(' ', '-'));
  }

  const res = await fetch(`${BASE_URL}/recipes/complexSearch?${params}`);
  if (res.status === 402) {
    const err = new Error('QUOTA_EXCEEDED');
    err.code = 'QUOTA_EXCEEDED';
    throw err;
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);

  const data = await res.json();
  poolCache[key] = data.results || [];
  return poolCache[key];
}

async function fetchRecipeDetail(id) {
  const params = new URLSearchParams({ apiKey: API_KEY });
  const res = await fetch(`${BASE_URL}/recipes/${id}/information?${params}`);
  if (res.status === 402) {
    const err = new Error('QUOTA_EXCEEDED');
    err.code = 'QUOTA_EXCEEDED';
    throw err;
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function pickRandom(arr, exclude = new Set()) {
  const candidates = arr.filter((r) => !exclude.has(r.id));
  if (!candidates.length) return arr[Math.floor(Math.random() * arr.length)] ?? null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// Map a selected cuisine to its API query string (Pakistani → Indian as fallback)
function cuisineApiQuery(cuisine) {
  if (cuisine === 'Pakistani') return 'Indian';
  return cuisine;
}

// Display label — keep Pakistani label as-is
function cuisineDisplayLabel(apiCuisine, original) {
  return original;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS = ['Breakfast', 'Lunch', 'Dinner'];

export async function generateWeekPlan(selectedCuisines, diet) {
  // Clear per-session pool cache for fresh generation
  Object.keys(poolCache).forEach((k) => delete poolCache[k]);

  const used = new Set();
  const week = {};

  for (const day of DAYS) {
    week[day] = {};
    const shuffledCuisines = [...selectedCuisines].sort(() => Math.random() - 0.5);

    let lunchCuisine = shuffledCuisines[0];
    let dinnerCuisine =
      shuffledCuisines.length > 1 ? shuffledCuisines[1] : shuffledCuisines[0];

    const assignments = {
      Breakfast: { cuisine: shuffledCuisines[Math.floor(Math.random() * shuffledCuisines.length)], mealType: 'breakfast' },
      Lunch: { cuisine: lunchCuisine, mealType: 'main course' },
      Dinner: { cuisine: dinnerCuisine, mealType: 'main course' },
    };

    for (const meal of MEALS) {
      const { cuisine, mealType } = assignments[meal];
      const apiCuisine = cuisineApiQuery(cuisine);
      let pool = await fetchPool(apiCuisine, mealType, diet);

      // Fallback: if pool is empty (common for breakfast + regional cuisines), retry without cuisine filter
      if (!pool.length) {
        pool = await fetchPool('', mealType, diet);
      }

      const stub = pickRandom(pool, used);
      if (!stub) {
        week[day][meal] = null;
        continue;
      }
      used.add(stub.id);

      const detail = await fetchRecipeDetail(stub.id);
      week[day][meal] = normalizeRecipe(detail, cuisine);
    }
  }

  return week;
}

export async function shuffleSingleMeal(cuisine, mealType, diet, excludeIds = []) {
  const apiCuisine = cuisineApiQuery(cuisine);
  const pool = await fetchPool(apiCuisine, mealType, diet);
  const excluded = new Set(excludeIds);
  const stub = pickRandom(pool, excluded);
  if (!stub) return null;
  const detail = await fetchRecipeDetail(stub.id);
  return normalizeRecipe(detail, cuisine);
}

function normalizeRecipe(detail, originalCuisine) {
  const cuisines = detail.cuisines && detail.cuisines.length > 0 ? detail.cuisines : [originalCuisine];
  const displayCuisine = originalCuisine || cuisines[0] || 'International';

  const ingredients = (detail.extendedIngredients || []).map((ing) => ({
    id: ing.id,
    displayText: stripHtml(ing.original || ing.originalName || ing.name),
    name: stripHtml(ing.name),
    amount: ing.amount,
    unit: stripHtml(ing.unit),
  }));

  const steps =
    detail.analyzedInstructions?.[0]?.steps?.map((s) => ({
      number: s.number,
      step: stripHtml(s.step),
    })) ?? [];

  return {
    id: detail.id,
    title: stripHtml(detail.title),
    image: detail.image,
    readyInMinutes: detail.readyInMinutes,
    servings: detail.servings,
    cuisine: displayCuisine,
    diets: detail.diets || [],
    sourceUrl: detail.sourceUrl || null,
    ingredients,
    steps,
  };
}
