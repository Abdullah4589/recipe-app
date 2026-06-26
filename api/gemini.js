// TheMealDB — free, no API key, no quota limits
const BASE  = 'https://www.themealdb.com/api/json/v1/1';
const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS = ['Breakfast', 'Lunch', 'Dinner'];

const delay = ms => new Promise(r => setTimeout(r, ms));

// ─── hardcoded weekly plans for 4 cuisines × 5 diets ─────────────────────────
const WEEK_PLANS = {
  Pakistani: {
    None: [
      { Breakfast: 'Halwa Puri',        Lunch: 'Chicken Biryani',   Dinner: 'Seekh Kebab'       },
      { Breakfast: 'Aloo Paratha',       Lunch: 'Beef Nihari',       Dinner: 'Chicken Karahi'    },
      { Breakfast: 'Keema Paratha',      Lunch: 'Daal Chawal',       Dinner: 'Mutton Rogan Josh' },
      { Breakfast: 'Anda Paratha',       Lunch: 'Chicken Handi',     Dinner: 'Shahi Korma'       },
      { Breakfast: 'Puri Bhaji',         Lunch: 'Qeema Matar',       Dinner: 'Lamb Paya'         },
      { Breakfast: 'Besan Chilla',       Lunch: 'Chicken Pulao',     Dinner: 'Boti Kebab'        },
      { Breakfast: 'Paratha with Chai',  Lunch: 'Biryani',           Dinner: 'Chicken Tikka'     },
    ],
    Vegetarian: [
      { Breakfast: 'Aloo Paratha',   Lunch: 'Daal Chawal',         Dinner: 'Paneer Karahi'          },
      { Breakfast: 'Halwa Puri',     Lunch: 'Chana Masala',        Dinner: 'Palak Paneer'           },
      { Breakfast: 'Puri Bhaji',     Lunch: 'Vegetable Biryani',   Dinner: 'Aloo Saag'             },
      { Breakfast: 'Besan Chilla',   Lunch: 'Sabzi Karahi',        Dinner: 'Daal Makhani'          },
      { Breakfast: 'Semolina Halwa', Lunch: 'Aloo Chanay',         Dinner: 'Mixed Vegetable Curry' },
      { Breakfast: 'Dahi Paratha',   Lunch: 'Tarka Daal',          Dinner: 'Chana Dal'             },
      { Breakfast: 'Fruit Chaat',    Lunch: 'Matar Paneer',        Dinner: 'Baingan Bharta'        },
    ],
    Vegan: [
      { Breakfast: 'Besan Chilla',  Lunch: 'Chana Masala',          Dinner: 'Aloo Saag'          },
      { Breakfast: 'Aloo Puri',     Lunch: 'Tarka Daal',            Dinner: 'Vegetable Biryani'  },
      { Breakfast: 'Fruit Chaat',   Lunch: 'Rajma',                 Dinner: 'Baingan Bharta'     },
      { Breakfast: 'Poha',          Lunch: 'Chana Dal',             Dinner: 'Aloo Palak'         },
      { Breakfast: 'Upma',          Lunch: 'Aloo Matar',            Dinner: 'Sabzi Karahi'       },
      { Breakfast: 'Rava Idli',     Lunch: 'Dal Tadka',             Dinner: 'Aloo Gobi'          },
      { Breakfast: 'Sooji Halwa',   Lunch: 'Black Chickpea Curry',  Dinner: 'Mixed Vegetable'    },
    ],
    'Gluten Free': [
      { Breakfast: 'Anda Bhurji',         Lunch: 'Chicken Karahi',   Dinner: 'Seekh Kebab'       },
      { Breakfast: 'Fruit Chaat',         Lunch: 'Chicken Biryani',  Dinner: 'Lamb Korma'        },
      { Breakfast: 'Dahi with Fruits',    Lunch: 'Daal Chawal',      Dinner: 'Chicken Tikka'     },
      { Breakfast: 'Scrambled Eggs',      Lunch: 'Beef Kofta',       Dinner: 'Shahi Korma'       },
      { Breakfast: 'Besan Chilla',        Lunch: 'Chicken Pulao',    Dinner: 'Mutton Rogan Josh' },
      { Breakfast: 'Omelette',            Lunch: 'Fish Curry',       Dinner: 'Chicken Handi'     },
      { Breakfast: 'Yogurt with Fruits',  Lunch: 'Chana Masala',     Dinner: 'Lamb Biryani'      },
    ],
    'High Protein': [
      { Breakfast: 'Anda Paratha',        Lunch: 'Chicken Biryani',    Dinner: 'Seekh Kebab'       },
      { Breakfast: 'Keema Paratha',       Lunch: 'Beef Nihari',        Dinner: 'Chicken Karahi'    },
      { Breakfast: 'Omelette',            Lunch: 'Daal with Chicken',  Dinner: 'Lamb Chops'        },
      { Breakfast: 'Boiled Eggs',         Lunch: 'Chicken Handi',      Dinner: 'Mutton Rogan Josh' },
      { Breakfast: 'Greek Yogurt',        Lunch: 'Qeema Matar',        Dinner: 'Grilled Chicken'   },
      { Breakfast: 'Egg Bhurji',          Lunch: 'Fish Curry',         Dinner: 'Chicken Tikka'     },
      { Breakfast: 'Paneer Bhurji',       Lunch: 'Chicken Pulao',      Dinner: 'Boti Kebab'        },
    ],
  },

  Indian: {
    None: [
      { Breakfast: 'Masala Dosa',   Lunch: 'Butter Chicken',    Dinner: 'Lamb Rogan Josh'     },
      { Breakfast: 'Idli Sambar',   Lunch: 'Chicken Biryani',   Dinner: 'Chicken Tikka Masala'},
      { Breakfast: 'Poha',          Lunch: 'Dal Makhani',       Dinner: 'Mutton Biryani'      },
      { Breakfast: 'Upma',          Lunch: 'Rajma Chawal',      Dinner: 'Fish Curry'          },
      { Breakfast: 'Chole Bhature', Lunch: 'Palak Chicken',     Dinner: 'Prawn Masala'        },
      { Breakfast: 'Aloo Puri',     Lunch: 'Chicken Handi',     Dinner: 'Keema Matar'         },
      { Breakfast: 'Rava Dosa',     Lunch: 'Dal Fry',           Dinner: 'Chicken Korma'       },
    ],
    Vegetarian: [
      { Breakfast: 'Masala Dosa',   Lunch: 'Dal Makhani',       Dinner: 'Paneer Tikka Masala'  },
      { Breakfast: 'Idli Sambar',   Lunch: 'Palak Paneer',      Dinner: 'Shahi Paneer'         },
      { Breakfast: 'Poha',          Lunch: 'Rajma Chawal',      Dinner: 'Kadai Paneer'         },
      { Breakfast: 'Upma',          Lunch: 'Chole Masala',      Dinner: 'Paneer Butter Masala' },
      { Breakfast: 'Chole Bhature', Lunch: 'Matar Paneer',      Dinner: 'Vegetable Biryani'   },
      { Breakfast: 'Aloo Puri',     Lunch: 'Dal Fry',           Dinner: 'Baingan Bharta'      },
      { Breakfast: 'Rava Dosa',     Lunch: 'Vegetable Korma',   Dinner: 'Dal Makhani'         },
    ],
    Vegan: [
      { Breakfast: 'Masala Dosa',   Lunch: 'Dal Tadka',             Dinner: 'Aloo Gobi'          },
      { Breakfast: 'Idli Sambar',   Lunch: 'Chana Masala',          Dinner: 'Baingan Bharta'     },
      { Breakfast: 'Poha',          Lunch: 'Rajma Chawal',          Dinner: 'Vegetable Biryani'  },
      { Breakfast: 'Upma',          Lunch: 'Dal Fry',               Dinner: 'Aloo Matar'         },
      { Breakfast: 'Rava Idli',     Lunch: 'Aloo Saag',             Dinner: 'Dal Tadka'          },
      { Breakfast: 'Aloo Paratha',  Lunch: 'Chana Dal',             Dinner: 'Bhindi Masala'      },
      { Breakfast: 'Oats Upma',     Lunch: 'Mixed Vegetable Curry', Dinner: 'Aloo Palak'         },
    ],
    'Gluten Free': [
      { Breakfast: 'Idli Sambar',       Lunch: 'Butter Chicken',   Dinner: 'Lamb Rogan Josh'      },
      { Breakfast: 'Poha',              Lunch: 'Dal Makhani',       Dinner: 'Chicken Tikka Masala' },
      { Breakfast: 'Sabudana Khichdi',  Lunch: 'Chicken Biryani',   Dinner: 'Fish Curry'           },
      { Breakfast: 'Upma',              Lunch: 'Rajma Chawal',      Dinner: 'Chicken Korma'        },
      { Breakfast: 'Banana Pancakes',   Lunch: 'Chana Masala',      Dinner: 'Prawn Masala'         },
      { Breakfast: 'Rice Dosa',         Lunch: 'Dal Tadka',         Dinner: 'Chicken Handi'        },
      { Breakfast: 'Omelette',          Lunch: 'Palak Chicken',     Dinner: 'Grilled Fish'         },
    ],
    'High Protein': [
      { Breakfast: 'Egg Masala Omelette', Lunch: 'Chicken Biryani',   Dinner: 'Lamb Rogan Josh'      },
      { Breakfast: 'Paneer Bhurji',       Lunch: 'Butter Chicken',    Dinner: 'Chicken Tikka Masala' },
      { Breakfast: 'Boiled Eggs',         Lunch: 'Dal Makhani',       Dinner: 'Mutton Curry'         },
      { Breakfast: 'Greek Yogurt',        Lunch: 'Chicken Handi',     Dinner: 'Fish Curry'           },
      { Breakfast: 'Moong Dal Chilla',    Lunch: 'Rajma Chawal',      Dinner: 'Prawn Masala'         },
      { Breakfast: 'Egg Bhurji',          Lunch: 'Palak Chicken',     Dinner: 'Chicken Korma'        },
      { Breakfast: 'Sprouts Chaat',       Lunch: 'Keema Matar',       Dinner: 'Grilled Chicken'      },
    ],
  },

  American: {
    None: [
      { Breakfast: 'Pancakes',           Lunch: 'BBQ Pulled Pork',      Dinner: 'Beef Steak'       },
      { Breakfast: 'French Toast',       Lunch: 'Clam Chowder',         Dinner: 'BBQ Baby Back Ribs'},
      { Breakfast: 'Eggs Benedict',      Lunch: 'Reuben Sandwich',      Dinner: 'Fried Chicken'    },
      { Breakfast: 'Waffles',            Lunch: 'Buffalo Wings',         Dinner: 'Chicken Pot Pie'  },
      { Breakfast: 'Buttermilk Biscuits',Lunch: 'BLT Sandwich',         Dinner: 'Lobster Roll'     },
      { Breakfast: 'Omelette',           Lunch: 'Mac and Cheese',        Dinner: 'Meatloaf'         },
      { Breakfast: 'Breakfast Burrito',  Lunch: 'Beef Burger',           Dinner: 'Grilled Salmon'   },
    ],
    Vegetarian: [
      { Breakfast: 'Pancakes',           Lunch: 'Grilled Cheese',       Dinner: 'Mac and Cheese'      },
      { Breakfast: 'French Toast',       Lunch: 'Tomato Soup',          Dinner: 'Vegetarian Chili'    },
      { Breakfast: 'Eggs Benedict',      Lunch: 'Veggie Burger',        Dinner: 'Mushroom Risotto'    },
      { Breakfast: 'Waffles',            Lunch: 'Caesar Salad',         Dinner: 'Eggplant Parmesan'   },
      { Breakfast: 'Omelette',           Lunch: 'Caprese Salad',        Dinner: 'Stuffed Bell Peppers'},
      { Breakfast: 'Avocado Toast',      Lunch: 'Grilled Cheese',       Dinner: 'Baked Potato'        },
      { Breakfast: 'Blueberry Muffins',  Lunch: 'Minestrone Soup',      Dinner: 'Pasta Primavera'     },
    ],
    Vegan: [
      { Breakfast: 'Avocado Toast',    Lunch: 'Veggie Burger',         Dinner: 'Vegetarian Chili'    },
      { Breakfast: 'Oatmeal',          Lunch: 'Lentil Soup',           Dinner: 'Black Bean Tacos'    },
      { Breakfast: 'Smoothie Bowl',    Lunch: 'Grain Bowl',            Dinner: 'Roasted Vegetable Bowl'},
      { Breakfast: 'Chia Pudding',     Lunch: 'Kale Salad',            Dinner: 'Stuffed Bell Peppers'},
      { Breakfast: 'Banana Pancakes',  Lunch: 'Tomato Basil Soup',     Dinner: 'Pasta Primavera'     },
      { Breakfast: 'Granola Bowl',     Lunch: 'Quinoa Salad',          Dinner: 'Lentil Loaf'         },
      { Breakfast: 'Fruit Salad',      Lunch: 'Black Bean Soup',       Dinner: 'Vegetable Stir Fry'  },
    ],
    'Gluten Free': [
      { Breakfast: 'Eggs Benedict',        Lunch: 'Grilled Chicken Salad', Dinner: 'Beef Steak'     },
      { Breakfast: 'Omelette',             Lunch: 'Clam Chowder',          Dinner: 'Grilled Salmon' },
      { Breakfast: 'Smoothie Bowl',        Lunch: 'BBQ Chicken',           Dinner: 'Fried Chicken'  },
      { Breakfast: 'Fruit Salad',          Lunch: 'Tuna Salad',            Dinner: 'Lamb Chops'     },
      { Breakfast: 'Chia Pudding',         Lunch: 'Chicken Soup',          Dinner: 'Grilled Shrimp' },
      { Breakfast: 'Greek Yogurt Parfait', Lunch: 'Cobb Salad',            Dinner: 'Roasted Chicken'},
      { Breakfast: 'Banana Pancakes',      Lunch: 'Caesar Salad',          Dinner: 'Fish Tacos'     },
    ],
    'High Protein': [
      { Breakfast: 'Eggs Benedict',        Lunch: 'Grilled Chicken Sandwich', Dinner: 'Beef Steak'      },
      { Breakfast: 'Omelette',             Lunch: 'Tuna Salad',               Dinner: 'Grilled Salmon'  },
      { Breakfast: 'Scrambled Eggs',       Lunch: 'BBQ Chicken',              Dinner: 'Lamb Chops'      },
      { Breakfast: 'Greek Yogurt Parfait', Lunch: 'Chicken Caesar Salad',     Dinner: 'Fried Chicken'   },
      { Breakfast: 'Boiled Eggs',          Lunch: 'Beef Burger',              Dinner: 'Turkey Meatballs'},
      { Breakfast: 'Protein Pancakes',     Lunch: 'Chicken Soup',             Dinner: 'Grilled Shrimp'  },
      { Breakfast: 'Cottage Cheese Bowl',  Lunch: 'Beef Stew',                Dinner: 'Roasted Chicken' },
    ],
  },

  French: {
    None: [
      { Breakfast: 'Croissant',              Lunch: 'Coq au Vin',        Dinner: 'Beef Bourguignon'   },
      { Breakfast: 'Pain au Chocolat',       Lunch: 'French Onion Soup', Dinner: 'Duck Confit'        },
      { Breakfast: 'Crepes',                 Lunch: 'Salade Nicoise',    Dinner: 'Bouillabaisse'      },
      { Breakfast: 'Quiche Lorraine',        Lunch: 'Ratatouille',       Dinner: 'Steak Frites'       },
      { Breakfast: 'French Toast',           Lunch: 'Croque Monsieur',   Dinner: 'Blanquette de Veau' },
      { Breakfast: 'Omelette Fines Herbes',  Lunch: 'Soupe au Pistou',  Dinner: 'Lamb Navarin'       },
      { Breakfast: 'Pain Perdu',             Lunch: 'Pot au Feu',        Dinner: 'Sole Meuniere'      },
    ],
    Vegetarian: [
      { Breakfast: 'Crepes',                Lunch: 'French Onion Soup',  Dinner: 'Ratatouille'        },
      { Breakfast: 'Quiche aux Legumes',    Lunch: 'Soupe au Pistou',   Dinner: 'Gratin Dauphinois'  },
      { Breakfast: 'Croissant',             Lunch: 'Ratatouille',        Dinner: 'Tarte aux Legumes'  },
      { Breakfast: 'French Toast',          Lunch: 'Salade Verte',       Dinner: 'Cheese Souffle'     },
      { Breakfast: 'Pain au Chocolat',      Lunch: 'Leek and Potato Soup',Dinner: 'Vegetable Quiche' },
      { Breakfast: 'Omelette Fines Herbes', Lunch: 'Tomato Tart',        Dinner: 'Courgette Gratin'  },
      { Breakfast: 'Pain Perdu',            Lunch: 'Beet Salad',         Dinner: 'Mushroom Risotto'  },
    ],
    Vegan: [
      { Breakfast: 'Toast with Jam',   Lunch: 'Soupe au Pistou',    Dinner: 'Ratatouille'         },
      { Breakfast: 'Crepes Vegan',     Lunch: 'French Lentil Soup', Dinner: 'Provencal Vegetables'},
      { Breakfast: 'Avocado Toast',    Lunch: 'Ratatouille',         Dinner: 'Lentilles du Puy'    },
      { Breakfast: 'Oatmeal',          Lunch: 'Tomato Soup',         Dinner: 'Stuffed Zucchini'    },
      { Breakfast: 'Fruit Salad',      Lunch: 'Minestrone',          Dinner: 'Vegetable Tart'      },
      { Breakfast: 'Granola Bowl',     Lunch: 'Beet Salad',          Dinner: 'Mushroom Bourguignon'},
      { Breakfast: 'Banana Crepes',    Lunch: 'Pea Soup',            Dinner: 'Aubergine Gratin'    },
    ],
    'Gluten Free': [
      { Breakfast: 'Omelette Fines Herbes', Lunch: 'Salade Nicoise',   Dinner: 'Steak Frites'    },
      { Breakfast: 'Buckwheat Crepes',      Lunch: 'French Onion Soup',Dinner: 'Duck Confit'     },
      { Breakfast: 'Fruit Salad',           Lunch: 'Ratatouille',      Dinner: 'Grilled Fish'    },
      { Breakfast: 'Yogurt with Berries',   Lunch: 'Beet Salad',       Dinner: 'Roasted Chicken' },
      { Breakfast: 'Scrambled Eggs',        Lunch: 'Leek Soup',        Dinner: 'Lamb Navarin'    },
      { Breakfast: 'Smoothie Bowl',         Lunch: 'Tomato Salad',     Dinner: 'Sole Meuniere'   },
      { Breakfast: 'Poached Eggs',          Lunch: 'Carrot Soup',      Dinner: 'Beef Bourguignon'},
    ],
    'High Protein': [
      { Breakfast: 'Omelette Fines Herbes', Lunch: 'Coq au Vin',        Dinner: 'Steak Frites'       },
      { Breakfast: 'Quiche Lorraine',       Lunch: 'Salade Nicoise',    Dinner: 'Duck Confit'        },
      { Breakfast: 'Scrambled Eggs',        Lunch: 'French Onion Soup', Dinner: 'Beef Bourguignon'   },
      { Breakfast: 'Greek Yogurt',          Lunch: 'Bouillabaisse',     Dinner: 'Lamb Navarin'       },
      { Breakfast: 'Eggs Benedict',         Lunch: 'Chicken Chasseur',  Dinner: 'Sole Meuniere'      },
      { Breakfast: 'Boiled Eggs',           Lunch: 'Pot au Feu',        Dinner: 'Roasted Duck'       },
      { Breakfast: 'Protein Crepes',        Lunch: 'Tuna Nicoise',      Dinner: 'Blanquette de Veau' },
    ],
  },
};

// ─── TheMealDB area map for non-hardcoded cuisines ────────────────────────────
const AREA_MAP = {
  Arabic:           'Egyptian',
  Mediterranean:    'Greek',
  Chinese:          'Chinese',
  Japanese:         'Japanese',
  Mexican:          'Mexican',
  Thai:             'Thai',
  Greek:            'Greek',
  Italian:          'Italian',
  'Middle Eastern': 'Moroccan',
};

const _areaCache = {};
const _dishCache  = {};

async function fetchAreaList(area) {
  if (_areaCache[area]) return _areaCache[area];
  try {
    const res  = await fetch(`${BASE}/filter.php?a=${encodeURIComponent(area)}`);
    if (!res.ok) return (_areaCache[area] = []);
    const data = await res.json();
    _areaCache[area] = data.meals || [];
  } catch (_e) {
    _areaCache[area] = [];
  }
  return _areaCache[area];
}

async function fetchById(id) {
  try {
    const res  = await fetch(`${BASE}/lookup.php?i=${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.meals?.[0] || null;
  } catch (_e) { return null; }
}

async function searchByName(name) {
  try {
    const res  = await fetch(`${BASE}/search.php?s=${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.meals?.[0] || null;
  } catch (_e) { return null; }
}

function stubRecipe(dishName, cuisine) {
  return {
    id:             `stub-${Math.random().toString(36).slice(2)}`,
    title:          dishName,
    image:          null,
    readyInMinutes: null,
    servings:       4,
    cuisine,
    diets:          [],
    sourceUrl:      null,
    ingredients:    [],
    steps:          [],
  };
}

// ─── normalize to app recipe shape ───────────────────────────────────────────

function normalize(raw, cuisine, titleOverride) {
  if (!raw) return null;
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name    = raw[`strIngredient${i}`];
    const measure = raw[`strMeasure${i}`];
    if (name && name.trim()) {
      ingredients.push({
        id:          i,
        displayText: [measure?.trim(), name.trim()].filter(Boolean).join(' '),
        name:        name.trim(),
        amount:      null,
        unit:        measure?.trim() || '',
      });
    }
  }
  const steps = (raw.strInstructions || '')
    .split(/\r?\n+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map((s, i) => ({ number: i + 1, step: s }));

  return {
    id:             String(raw.idMeal),
    title:          titleOverride || raw.strMeal,
    image:          raw.strMealThumb || null,
    readyInMinutes: null,
    servings:       4,
    cuisine,
    diets:          [],
    sourceUrl:      raw.strSource || null,
    ingredients,
    steps,
  };
}

// ─── find recipe for a hardcoded dish name ────────────────────────────────────

async function findRecipeForDish(dishName, cuisine) {
  const key = `${cuisine}:${dishName}`;
  if (_dishCache[key]) return _dishCache[key];

  let raw = null;

  try {
    // 1. Exact name search
    raw = await searchByName(dishName);

    // 2. Try the longest meaningful word
    if (!raw) {
      const keyword = dishName.split(' ').filter(w => w.length > 3).pop();
      if (keyword && keyword !== dishName) raw = await searchByName(keyword);
    }

    // 3. Fall back to area search
    if (!raw) {
      const area = AREA_MAP[cuisine] || 'Indian';
      const list = await fetchAreaList(area);
      if (list.length) {
        const pick = list[Math.floor(Math.random() * list.length)];
        raw = await fetchById(pick.idMeal);
      }
    }
  } catch (_e) {
    raw = null;
  }

  // Always return something — stub keeps the dish name visible even when offline
  const result = raw ? normalize(raw, cuisine, dishName) : stubRecipe(dishName, cuisine);
  _dishCache[key] = result;
  return result;
}

// ─── diet / area helpers for non-hardcoded cuisines ──────────────────────────

const MEAT        = ['chicken','beef','pork','lamb','mutton','turkey','duck','fish','salmon','tuna','shrimp','prawn','bacon','ham','sausage','veal','anchovy','crab','lobster'];
const DAIRY_EGG   = ['milk','cheese','butter','cream','yogurt','egg','ghee','whey'];
const GLUTEN_KEYS = ['flour','bread','pasta','wheat','barley','rye','noodle','breadcrumb'];

function ingNames(raw) {
  const list = [];
  for (let i = 1; i <= 20; i++) { const n = raw[`strIngredient${i}`]; if (n?.trim()) list.push(n.toLowerCase()); }
  return list;
}
function matchesDiet(raw, diet) {
  if (!diet || diet === 'None' || diet === 'High Protein') return true;
  const ings = ingNames(raw);
  const has  = kws => kws.some(k => ings.some(i => i.includes(k)));
  if (diet === 'Vegetarian') return !has(MEAT);
  if (diet === 'Vegan')      return !has([...MEAT, ...DAIRY_EGG]);
  if (diet === 'Gluten Free') return !has(GLUTEN_KEYS);
  return true;
}

async function pickRecipe(cuisine, diet, usedIds) {
  const area = AREA_MAP[cuisine] || 'American';
  const list = await fetchAreaList(area);
  if (!list.length) return null;

  const pool = [...list].sort(() => Math.random() - 0.5).filter(m => !usedIds.has(m.idMeal));
  const candidates = (pool.length ? pool : [...list].sort(() => Math.random() - 0.5)).slice(0, 10);

  for (const c of candidates) {
    await delay(100);
    const full = await fetchById(c.idMeal);
    if (full && matchesDiet(full, diet)) return normalize(full, cuisine);
  }
  for (const c of candidates) {
    const full = await fetchById(c.idMeal);
    if (full) return normalize(full, cuisine);
  }
  return null;
}

function buildCuisineMap(cuisines, days) {
  const map = {};
  days.forEach((day, i) => { map[day] = cuisines[i % cuisines.length]; });
  return map;
}

// ─── public API ───────────────────────────────────────────────────────────────

export async function generateWeekPlan(selectedCuisines, diet) {
  Object.keys(_areaCache).forEach(k => delete _areaCache[k]);
  Object.keys(_dishCache).forEach(k => delete _dishCache[k]);

  const cuisineMap = buildCuisineMap(selectedCuisines, DAYS);
  const week    = {};
  const usedIds = new Set();

  for (let i = 0; i < DAYS.length; i++) {
    const day     = DAYS[i];
    const cuisine = cuisineMap[day];
    week[day] = {};

    const hardcoded = WEEK_PLANS[cuisine];
    if (hardcoded) {
      const dietPlan = hardcoded[diet] || hardcoded['None'];
      const daySlot  = dietPlan[i % 7];
      for (const meal of MEALS) {
        await delay(150);
        week[day][meal] = await findRecipeForDish(daySlot[meal], cuisine);
      }
    } else {
      for (const meal of MEALS) {
        try {
          const recipe = await pickRecipe(cuisine, diet, usedIds);
          week[day][meal] = recipe;
          if (recipe?.id) usedIds.add(recipe.id);
        } catch (_e) {
          week[day][meal] = null;
        }
        await delay(100);
      }
    }
  }
  return week;
}

export async function shuffleSingleMeal(cuisine, mealType, diet, excludeIds = []) {
  const hardcoded = WEEK_PLANS[cuisine];
  if (hardcoded) {
    const dietPlan = hardcoded[diet] || hardcoded['None'];
    const allDishes = dietPlan.map(d => d[mealType]);
    const pool = allDishes.filter((_, idx) => !excludeIds.includes(String(idx)));
    const dishName = pool[Math.floor(Math.random() * pool.length)] || allDishes[0];
    return findRecipeForDish(dishName, cuisine);
  }
  return pickRecipe(cuisine, diet, new Set(excludeIds.map(String)));
}
