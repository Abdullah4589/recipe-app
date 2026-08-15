# CLAUDE.md — MealPlanner Project

## Overview

React Native / Expo SDK 54 meal planner app with a Node.js + Express + MongoDB backend. Users register/login, pick cuisines and a diet, get a 7-day meal plan from TheMealDB, and sync everything to the cloud.

**Why the stack is what it is: `docs/DECISIONS.md`.** Read it before proposing
an architectural change — several obvious-looking "improvements" were already
considered and rejected for reasons recorded there, and a few are recorded as
debt we have accepted on purpose.

---

# Rules

These are not style preferences. Each one exists because violating it has a
specific, known cost. The ones marked **[enforced]** are additionally checked
by `.claude/hooks/` and by CI — prose can be rationalised past mid-task, an
exit code cannot.

## Non-negotiable

1. **[enforced] Never commit secrets.** No credential, connection string,
   token or signing key in a tracked file — ever, not even temporarily, not
   even "I'll remove it in the next commit". Git history keeps it, so the only
   real remedy is rotating the credential. Config comes from `process.env`;
   new variables get their *name* documented in `.env.example`.
2. **[enforced] Never commit directly to `main`.** Branch, then PR. CI is the
   thing that catches what review misses, and it only runs on a PR.
3. **[enforced] Never use `--no-verify`, plain `--force`, or `git reset
   --hard`.** Bypassing a hook hides a failure rather than fixing it; a plain
   force-push can discard someone else's commits (`--force-with-lease` fails
   safely instead); a hard reset destroys work with no recovery path.
4. **[enforced] Never deploy from an agent session.** Deploys are
   outward-facing and hard to reverse. They run through
   `.github/workflows/deploy.yml`, gated on a green test run.
5. **Never weaken a test to make it pass.** Do not delete, `.skip`, or widen
   an assertion, and do not swap a real call for a mock to get green. A red
   test is information; a test lowered until it passes destroys that
   information *and* hides the bug. If a test is genuinely wrong, say so
   explicitly and explain why.
6. **Never report unverified work as done.** "Tests pass" requires having run
   them and being able to paste the output. If something is partial, blocked,
   or skipped, say which part and why.

## Code

- **Ownership filters are load-bearing.** MongoDB has no foreign keys here
  (ADR-002), so every query touching user data filters by `req.user.id`, and a
  no-match returns **404, never `{ success: true }`**. This project has
  shipped that exact bug before: two delete routes reported success while
  deleting nothing, which made "delete another user's data" look like it
  worked.
- **Errors are classified centrally**, in `backend/middleware/errorHandler.js`.
  Throw `badRequest()` / `notFound()`; let the handler map the status. Do not
  reintroduce per-route `catch (e) { res.status(500) }` — it turns client
  mistakes into 500s and buries real faults.
- **Wrap async routes in `asyncHandler`.** Express 4 does not catch rejected
  promises; an unwrapped async handler hangs the request until it times out.
- **Client-facing errors never echo internals.** Log the detail; return
  something generic. Driver and schema text leaks structure.
- **Auth failures must be indistinguishable.** Same status and message for
  "no such user" and "wrong password", or the endpoint becomes an account
  enumerator.
- **`catch (_e)`, never bare `catch {}`** — Hermes/RN compatibility.
- **Interactive elements need `testID` plus `accessibilityRole` /
  `accessibilityLabel`.** State conveyed only by colour is invisible to both
  screen readers and tests. Note that react-native-web drops `aria-selected`
  on `role="button"`, so selected state must also appear in the accessible
  name.
- **No hardcoded backend URL.** `api/backend.js` reads
  `EXPO_PUBLIC_BACKEND_URL`; the deployed URL is only a fallback. This is what
  lets e2e point the real app at a disposable backend.
- **`Alert.alert` is a no-op on react-native-web.** Any error path that relies
  on it alone is invisible on web. Render inline state as well.

## Tests

- **Two tiers, different jobs** (ADR-007). `tests/integration/` — HTTP against
  the real app, no browser; the default. `tests/e2e/` — real UI in Chromium;
  only for journeys crossing UI → API → DB.
- **Both run against `backend/test-server.js`** — the real app on a throwaway
  in-memory MongoDB. Never point a test at the deployed backend.
- **No mocks of Mongoose or Express.** A mock asserts that the mock was
  called. Mocking `fetch` for TheMealDB is fine — that is a third-party
  network dependency.
- **Every test creates its own user** with a unique email. Tests must pass in
  any order, in isolation.
- **No `waitForTimeout`.** Use `toBeVisible()`, `expect.poll`, or
  `waitForResponse`. A fixed sleep is a flake with a delay fuse.
- **New route → integration test. New user journey → e2e test.**

## Git and GitHub workflow

- Branch names: `feat/`, `fix/`, `chore/`, `docs/`, `test/` + short kebab
  description.
- **Stage files by name.** No `git add -A` / `git add .` — that is how `.env`
  files, build output and unrelated debris end up in commits. **[enforced]**
- Commit messages say *why*, not just what. The diff already shows what.
- One logical change per PR. A PR that fixes a bug and refactors two modules
  cannot be reviewed properly or reverted cleanly.
- Every PR must pass CI before merge. If CI is red, fix the cause — do not
  re-run hoping for green. A test that passes on retry is a flake and needs
  its non-determinism named.
- Never rewrite published history on a shared branch.

## Deployments

Three targets, deliberately separate (ADR-006):

| Target | What | Gate |
|---|---|---|
| Railway | Express backend | CI green on `main` |
| Vercel | Expo web export | CI green on `main` |
| EAS | Android build / OTA update | Manual, by the user |

- **CI is the only automated path to production.** No agent-initiated deploys.
- **Check env parity before shipping.** Every `process.env.X` newly referenced
  must exist in the target's environment. A missing variable fails at runtime,
  not at build time — the worst time to find out.
- **Schema changes need a stated migration story.** There is no migration
  framework here. Making an existing field `required` breaks reads of every
  document written before it. Say what happens to existing data, in the PR.
- **An OTA update via EAS ships JS to installed apps immediately.** It does
  not go through review, and there is no staged rollout configured. Treat it
  with more care than a web deploy, not less.

## Agents and commands

- `/verify` — run both tiers, classify every failure, report. Does not fix.
- `/feature <description>` — test → implement → review handoff chain.
- `/ship` — pre-flight a branch for release; recommends, never deploys.
- Agents: `test-author` (writes tests, never fixes app code), `bug-fixer`
  (fixes app code, never edits tests), `pr-reviewer` (reports, never edits),
  `release-checker` (verifies, never deploys).

The separation is the point. An agent that both writes the test and makes it
pass will quietly reshape the test until the code it already wrote is correct.

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
# Phone must be on the same WiFi as the dev machine
# Set EXPO_PUBLIC_BACKEND_URL in .env to your LAN IP (not localhost)
```

### Tests
```bash
npm run test:integration   # fast — HTTP against the real app, no browser
npm run test:e2e           # slow — real UI in Chromium
npm run test               # both
```
Both run against a disposable in-memory MongoDB, never the deployed backend.
See `tests/README.md` for the gotchas, `docs/WORKFLOW.md` for CI and deploys.

## Key files

| File | Role |
|------|------|
| `api/gemini.js` | TheMealDB integration — `generateWeekPlan`, `shuffleSingleMeal`, `WEEK_PLANS` hardcoded catalog |
| `api/backend.js` | All HTTP calls to the Express backend; reads `EXPO_PUBLIC_BACKEND_URL` |
| `context/AuthContext.js` | JWT token stored in AsyncStorage, `setAuthToken` wired to `api/backend.js` on load |
| `utils/storage.js` | AsyncStorage wrappers — cache versioned with `CACHE_VERSION = 'v4-mealdb'` |
| `backend/app.js` | Express **app factory** — no DB connect, no listen, so tests can boot the real app |
| `backend/server.js` | Process entry — connects Mongo, listens |
| `backend/test-server.js` | Boots the real app on a throwaway in-memory MongoDB for tests |
| `backend/middleware/errorHandler.js` | Central error → status mapping; `badRequest()` / `notFound()` |
| `backend/utils/asyncHandler.js` | Wraps async routes so rejections reach the error handler |
| `scripts/serve-web.js` | Builds + serves the Expo web export for e2e |
| `backend/.env` | **Not committed** — `MONGODB_URI`, `JWT_SECRET`. Template: `.env.example` |
| `docs/DECISIONS.md` | Why the stack is what it is, with trade-offs |
| `docs/WORKFLOW.md` | Guardrails, agents, CI, branch protection, deploys |

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
Set `EXPO_PUBLIC_BACKEND_URL` in `.env` at the repo root — do **not** hardcode
it in `api/backend.js` (CI fails if you do; it is what makes e2e possible):

```bash
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.5:3000/api
```

Use your machine's LAN IP (`ipconfig` on Windows). Never `localhost` — the
phone cannot reach the dev machine's loopback. Expo inlines `EXPO_PUBLIC_*` at
bundle time, so changing it needs a restart with `--clear`, not just a reload.

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
- `react-native-web` — what makes browser e2e possible
- `@playwright/test` (dev)

### Backend (backend/package.json)
- `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`
- `nodemon`, `mongodb-memory-server` (dev)
