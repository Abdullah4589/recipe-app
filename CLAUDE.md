# CLAUDE.md — MealPlanner Project

## Overview

React Native / Expo SDK 54 meal planner app with a Node.js + Express + MongoDB backend. Users register/login, pick cuisines and a diet, get a 7-day meal plan from TheMealDB, and sync everything to the cloud.

## Running the project

### Backend (run first)
```bash
cd backend
npm run dev
# Expects: backend/.env with MONGODB_URI and JWT_SECRET
# Runs on: http://localhost:3000
```

### Frontend
```bash
npx expo start --clear
# Phone must be on same WiFi as the dev machine
# Set BACKEND_URL in api/backend.js to your local IP (not localhost)
```

## Key files

| File | Role |
|------|------|
| `api/gemini.js` | TheMealDB integration — `generateWeekPlan`, `shuffleSingleMeal`, `WEEK_PLANS` hardcoded catalog |
| `api/backend.js` | All HTTP calls to the Express backend — auth, meal plan, favourites, custom recipes, preferences |
| `context/AuthContext.js` | JWT token stored in AsyncStorage, `setAuthToken` wired to `api/backend.js` on load |
| `utils/storage.js` | AsyncStorage wrappers — cache versioned with `CACHE_VERSION = 'v4-mealdb'` |
| `backend/server.js` | Express entry point, mounts all routers |
| `backend/.env` | **Not committed** — contains `MONGODB_URI` and `JWT_SECRET` |

## Architecture

```
Phone
  └── Expo app
        ├── Auth gate (LoginScreen / RegisterScreen)
        ├── HomeScreen — cuisine + diet picker, syncs to backend /api/preferences
        ├── WeeklyPlanScreen — loads cloud plan → local cache → generates fresh
        │     └── saves to both AsyncStorage and /api/meal-plan on every change
        ├── RecipeDetailScreen — heart button saves to /api/favourites
        ├── FavouritesScreen — reads /api/favourites
        └── CustomRecipesScreen — full CRUD via /api/custom-recipes

Express backend (port 3000)
  └── MongoDB Atlas
        ├── users           (email, hashed password)
        ├── mealplans       (one per user, upserted)
        ├── favourites      (many per user)
        ├── customrecipes   (many per user)
        └── preferences     (one per user, upserted)
```

## TheMealDB meal plan logic

- `WEEK_PLANS` in `api/gemini.js` has hardcoded dish names for Pakistani / Indian / American / French × 5 diets × 7 days × 3 meals
- `findRecipeForDish(dishName, cuisine)` — exact name search → keyword search → area fallback → `stubRecipe()` if all fail
- `stubRecipe()` returns a minimal object so the UI never shows a blank slot even offline
- `AREA_MAP` maps app cuisine names to TheMealDB area names (e.g. Arabic → Egyptian)
- All `catch` blocks use `catch (_e)` for Hermes/RN compatibility — bare `catch {}` may not work

## Common tasks

### Changing the backend URL
Edit line 3 of `api/backend.js`:
```js
export const BACKEND_URL = 'http://YOUR_LOCAL_IP:3000/api';
```
Use your machine's LAN IP (find with `ipconfig` on Windows). Never use `localhost` — the phone can't reach it.

### Clearing the meal plan cache
Change `CACHE_VERSION` in `utils/storage.js` to any new string (e.g. `v5-mealdb`). All cached plans on device are invalidated on next load.

### Adding a new cuisine with hardcoded meals
Add an entry to `WEEK_PLANS` in `api/gemini.js` following the existing structure:
```js
WEEK_PLANS['NewCuisine'] = {
  None: [ /* 7 day objects with Breakfast/Lunch/Dinner */ ],
  Vegetarian: [...],
  // ...
}
```
Also add it to `ALL_CUISINES` in `screens/HomeScreen.js` and `CuisineBadge` in `constants/theme.js`.

### Restarting Metro when port 8081 is busy
```powershell
$p = (netstat -ano | Select-String ":8081.*LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] })[0]
taskkill /PID $p /F
npx expo start --clear
```

## Backend routes summary

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/meal-plan          (auth)
POST   /api/meal-plan          (auth)
GET    /api/favourites         (auth)
POST   /api/favourites         (auth)
DELETE /api/favourites/:id     (auth)
GET    /api/custom-recipes     (auth)
POST   /api/custom-recipes     (auth)
PUT    /api/custom-recipes/:id (auth)
DELETE /api/custom-recipes/:id (auth)
GET    /api/preferences        (auth)
PUT    /api/preferences        (auth)
GET    /api/health             (public)
```

## Dependencies

### Frontend (package.json)
- `expo` SDK 54
- `@react-navigation/native` + `@react-navigation/stack`
- `react-native-gesture-handler`, `react-native-safe-area-context`
- `@react-native-async-storage/async-storage`

### Backend (backend/package.json)
- `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`
- `nodemon` (dev)
