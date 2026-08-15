// Unit tests for api/gemini.js — the TheMealDB integration layer. These are
// pure-logic tests: global.fetch is mocked per test, no network/backend
// involved. See _load-gemini.js for how the ES module is loaded under Node.
const { test, expect } = require('@playwright/test');
const { loadGeminiModule } = require('./_load-gemini');

function fullMeal(overrides = {}) {
  return {
    idMeal: '1001',
    strMeal: 'Mock Meal',
    strMealThumb: 'https://example.test/thumb.jpg',
    strInstructions: 'Step one.\nStep two.\nStep three.',
    strSource: 'https://example.test/source',
    strIngredient1: 'Rice', strMeasure1: '1 cup',
    strIngredient2: 'Salt', strMeasure2: '1 tsp',
    ...overrides,
  };
}

function jsonResponse(body, ok = true) {
  return { ok, json: async () => body };
}

test.describe('gemini.js — generateWeekPlan (hardcoded cuisines)', () => {
  test('builds a full 7-day x 3-meal plan using dish names from WEEK_PLANS', async () => {
    const { generateWeekPlan } = loadGeminiModule();
    global.fetch = async (url) => {
      if (String(url).includes('search.php')) return jsonResponse({ meals: [fullMeal()] });
      return jsonResponse({ meals: null });
    };

    const week = await generateWeekPlan(['Pakistani'], 'None');
    const days = Object.keys(week);
    expect(days).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    for (const day of days) {
      expect(Object.keys(week[day])).toEqual(['Breakfast', 'Lunch', 'Dinner']);
      for (const meal of ['Breakfast', 'Lunch', 'Dinner']) {
        expect(week[day][meal]).toBeTruthy();
        expect(typeof week[day][meal].title).toBe('string');
      }
    }
    // Monday breakfast for Pakistani/None is hardcoded as "Halwa Puri"
    expect(week.Mon.Breakfast.title).toBe('Halwa Puri');
  });

  test('normalizes ingredients and numbered steps from the raw TheMealDB record', async () => {
    const { generateWeekPlan } = loadGeminiModule();
    global.fetch = async (url) => {
      if (String(url).includes('search.php')) return jsonResponse({ meals: [fullMeal()] });
      return jsonResponse({ meals: null });
    };
    const week = await generateWeekPlan(['Pakistani'], 'None');
    const recipe = week.Mon.Breakfast;
    expect(recipe.ingredients).toEqual([
      { id: 1, displayText: '1 cup Rice', name: 'Rice', amount: null, unit: '1 cup' },
      { id: 2, displayText: '1 tsp Salt', name: 'Salt', amount: null, unit: '1 tsp' },
    ]);
    expect(recipe.steps).toEqual([
      { number: 1, step: 'Step one.' },
      { number: 2, step: 'Step two.' },
      { number: 3, step: 'Step three.' },
    ]);
  });

  test('falls back to a stub recipe when TheMealDB is unreachable (offline resilience)', async () => {
    const { generateWeekPlan } = loadGeminiModule();
    global.fetch = async () => { throw new Error('network down'); };

    const week = await generateWeekPlan(['Pakistani'], 'None');
    const recipe = week.Mon.Breakfast;
    expect(recipe.title).toBe('Halwa Puri'); // dish name preserved even offline
    expect(recipe.image).toBeNull();
    expect(recipe.ingredients).toEqual([]);
    expect(recipe.steps).toEqual([]);
    expect(recipe.id).toMatch(/^stub-/);
  });

  test('cycles through multiple selected cuisines across the week', async () => {
    const { generateWeekPlan } = loadGeminiModule();
    global.fetch = async (url) => {
      if (String(url).includes('search.php')) return jsonResponse({ meals: [fullMeal()] });
      return jsonResponse({ meals: null });
    };
    const week = await generateWeekPlan(['Pakistani', 'Indian'], 'None');
    // Mon -> Pakistani, Tue -> Indian, Wed -> Pakistani, ... (alternating by day index)
    expect(week.Mon.Breakfast.title).toBe('Halwa Puri');   // Pakistani day-0 breakfast
    expect(week.Tue.Breakfast.title).toBe('Idli Sambar');  // Indian day-1 breakfast
  });
});

test.describe('gemini.js — shuffleSingleMeal (hardcoded cuisines)', () => {
  test('returns a dish not in the excluded index list', async () => {
    const { shuffleSingleMeal } = loadGeminiModule();
    global.fetch = async (url) => {
      if (String(url).includes('search.php')) return jsonResponse({ meals: [fullMeal()] });
      return jsonResponse({ meals: null });
    };
    // Exclude every day index except 6 ("Paratha with Chai" for Pakistani/None/Breakfast)
    const result = await shuffleSingleMeal('Pakistani', 'Breakfast', 'None', ['0', '1', '2', '3', '4', '5']);
    expect(result.title).toBe('Paratha with Chai');
  });
});

test.describe('gemini.js — non-hardcoded cuisines (live TheMealDB area search)', () => {
  test('fetches from the mapped TheMealDB area and normalizes the result', async () => {
    const { generateWeekPlan } = loadGeminiModule();
    global.fetch = async (url) => {
      const u = String(url);
      if (u.includes('filter.php')) {
        expect(u).toContain('a=Italian'); // AREA_MAP.Italian === 'Italian'
        return jsonResponse({ meals: [{ idMeal: '55', strMeal: 'Carbonara' }] });
      }
      if (u.includes('lookup.php')) {
        return jsonResponse({ meals: [fullMeal({ idMeal: '55', strMeal: 'Carbonara' })] });
      }
      return jsonResponse({ meals: null });
    };
    const week = await generateWeekPlan(['Italian'], 'None');
    expect(week.Mon.Breakfast.title).toBe('Carbonara');
    expect(week.Mon.Breakfast.id).toBe('55');
  });

  test('skips meat-containing candidates when diet is Vegetarian', async () => {
    const { generateWeekPlan } = loadGeminiModule();
    global.fetch = async (url) => {
      const u = String(url);
      if (u.includes('filter.php')) {
        return jsonResponse({ meals: [{ idMeal: '1' }, { idMeal: '2' }] });
      }
      if (u.includes('lookup.php')) {
        const id = new URL(u).searchParams.get('i');
        if (id === '1') {
          return jsonResponse({ meals: [fullMeal({ idMeal: '1', strMeal: 'Chicken Dish', strIngredient1: 'Chicken' })] });
        }
        return jsonResponse({ meals: [fullMeal({ idMeal: '2', strMeal: 'Veggie Dish', strIngredient1: 'Carrot', strIngredient2: 'Onion' })] });
      }
      return jsonResponse({ meals: null });
    };
    const week = await generateWeekPlan(['Italian'], 'Vegetarian');
    // Every meal across the week should have resolved to the meat-free dish.
    const allTitles = Object.values(week).flatMap(day => Object.values(day).map(r => r?.title));
    expect(allTitles.every(t => t === 'Veggie Dish')).toBe(true);
  });
});
