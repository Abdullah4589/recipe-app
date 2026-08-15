# Test suite

Two tiers, one Playwright config, both running against the real application.

|  | `tests/integration/` | `tests/e2e/` |
|---|---|---|
| Drives | Express over HTTP | The real UI in Chromium |
| Browser | No | Yes (react-native-web) |
| Speed | ~45s for the whole tier | ~3 min, plus a one-off web build |
| Covers | The full API surface | The journeys that must never break |

Neither tier touches the deployed Railway backend or its database. Both boot
`backend/test-server.js`: the real Express app on a disposable in-memory
MongoDB (`mongodb-memory-server`) at `localhost:4000`.

## Running

```bash
npm run test               # both tiers
npm run test:integration   # fast — run this constantly
npm run test:e2e           # slow — run before pushing
npm run test:report        # open the last HTML report
```

The web server for e2e only starts when the e2e project is selected, so
`test:integration` does not pay for an Expo export it never uses.

While iterating on e2e specs, reuse the existing build:

```bash
E2E_SKIP_BUILD=1 npm run test:e2e
```

**Only do that when you have not changed application code** — otherwise you are
testing the previous build and the result is meaningless.

## Why no unit tests with mocks

The bugs this app actually has live at boundaries: does the auth middleware
reject a malformed header, does a route filter by `userId`, does a plan survive
a save/load round trip, does the session survive a reload. A mocked Mongoose
asserts that the mock was called. Running the real app against a real
disposable database asserts that the app works.

Mocking `fetch` for TheMealDB *is* fine — that is a third-party network
dependency, not our code. `tests/integration/gemini.spec.js` shows the pattern.

## Layout

**`tests/integration/`**

| File | Covers |
|---|---|
| `_helpers.js` | Unique test emails, register-user shortcut |
| `_load-gemini.js` | Transpiles `api/gemini.js` (ESM) for CommonJS Node |
| `health.spec.js` | `/api/health` |
| `auth.spec.js` | Register/login, validation, duplicate email, enumeration |
| `middleware.spec.js` | Token edge cases |
| `meal-plan.spec.js` | Save/load/upsert |
| `favourites.spec.js` | CRUD + cross-user isolation |
| `custom-recipes.spec.js` | CRUD + cross-user isolation |
| `preferences.spec.js` | Cuisine/diet preferences |
| `gemini.spec.js` | Plan generation, diet filtering, offline fallback |

**`tests/e2e/`**

| File | Covers |
|---|---|
| `_app.js` | Splash wait, register/login via UI, scoped back button, token read |
| `auth.spec.js` | Register, sign back in, wrong password, reload persistence |
| `meal-plan.spec.js` | Generate a week, cloud persistence, favouriting |

## Writing e2e tests — things that will bite you

These are all learned the hard way; each one cost a red run.

- **`testID` becomes `data-testid`.** `page.getByTestId()` finds it with no
  config.
- **`aria-selected` is dropped on `role="button"`.** react-native-web is right
  to do this — ARIA does not allow it there. Selected state has to live in the
  accessible name, so assert on `aria-label`.
- **Previous screens stay mounted.** React Navigation does not unmount the
  stack, so a testID that repeats across screens matches several elements and
  trips strict mode. Scope it: `tapBackOn(page, 'recipe-detail-screen')`.
- **`Alert.alert` does nothing on web.** An error path that only fires an Alert
  is invisible. Both auth screens render inline `auth-error` text for this
  reason.
- **Browser back navigates away from the app.** There is no `linking` config,
  so React Navigation state is not in browser history. Use in-app back buttons,
  never `page.goBack()`.
- **The splash animation runs ~2.5s** before anything is interactive. `openApp`
  waits it out.
- **No `waitForTimeout`.** Use `toBeVisible()`, `expect.poll`, or
  `waitForResponse`.

## A note on red tests

Several integration tests were originally written against *intended* behaviour
rather than what the code did — marked `// EXPECTED (spec): ...`. They failed on
purpose, and each one turned out to be a real bug, including two routes that
reported `{ success: true }` while deleting nothing, which made deleting another
user's data look like it had worked.

Those are fixed and the tier is green. The convention stands: **assert what the
code should do, and let it fail.** A test lowered until it passes destroys the
signal it exists to produce.
