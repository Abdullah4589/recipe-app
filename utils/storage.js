import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_VERSION = 'v4-mealdb';

const KEYS = {
  MEAL_PLAN: '@meal_plan',
  CUISINES: '@cuisines',
  DIET: '@diet',
  THEME: '@theme',
  DARK_MODE: '@dark_mode',
};

export async function saveMealPlan(plan) {
  const payload = { plan, savedAt: new Date().toISOString(), version: CACHE_VERSION };
  await AsyncStorage.setItem(KEYS.MEAL_PLAN, JSON.stringify(payload));
}

export async function loadMealPlan() {
  const raw = await AsyncStorage.getItem(KEYS.MEAL_PLAN);
  if (!raw) return null;
  const data = JSON.parse(raw);
  // Discard plans saved by older API versions
  if (data.version !== CACHE_VERSION) return null;
  return data;
}

export async function saveCuisines(cuisines) {
  await AsyncStorage.setItem(KEYS.CUISINES, JSON.stringify(cuisines));
}

export async function loadCuisines() {
  const raw = await AsyncStorage.getItem(KEYS.CUISINES);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function saveDiet(diet) {
  await AsyncStorage.setItem(KEYS.DIET, diet);
}

export async function loadDiet() {
  return AsyncStorage.getItem(KEYS.DIET);
}

export async function saveThemeKey(key) {
  await AsyncStorage.setItem(KEYS.THEME, key);
}

export async function loadThemeKey() {
  return AsyncStorage.getItem(KEYS.THEME);
}

export async function saveDarkMode(isDark) {
  await AsyncStorage.setItem(KEYS.DARK_MODE, isDark ? '1' : '0');
}

export async function loadDarkMode() {
  const val = await AsyncStorage.getItem(KEYS.DARK_MODE);
  return val === '1';
}
