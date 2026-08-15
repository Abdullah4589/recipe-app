# Architecture Decision Records — MealPlanner

Every entry answers the same four questions: what was decided, what the
alternatives were, what it cost us, and what would make us change our mind.
The last question is the important one — a decision you can't imagine
reversing wasn't a decision, it was a default.

Status legend: **Accepted** (in force) · **Accepted with debt** (in force, but
we know what it's costing us) · **Superseded**.

---

## ADR-001 — Expo (managed workflow) instead of bare React Native

**Status:** Accepted

**Decision.** Build on Expo SDK 54 managed workflow rather than bare React
Native or a native Android/iOS pair.

**Why.** The app is CRUD over a REST API with no native module requirements —
no Bluetooth, no background location, no camera pipeline, no custom native
SDK. Everything it needs (AsyncStorage, gesture handler, safe-area, status
bar) is in the Expo module set. In exchange, Expo gives three things that
would otherwise be days of work each:

- **EAS Build** — Android AAB/APK without a local Android toolchain. Relevant
  because the dev machine here is Windows, so an iOS build would otherwise be
  impossible without a Mac.
- **Expo Go / EAS Update** — reviewers scan a QR code and have the app. For a
  portfolio project where "can I see it?" is the whole point, that is the
  single highest-value feature in the stack.
- **`react-native-web`** — the same component tree renders in a browser. This
  is what makes the Playwright e2e suite in `tests/e2e/` possible at all (see
  ADR-007).

**Cost accepted.** We are pinned to Expo's SDK release cadence, and adding a
native module that Expo doesn't wrap means either a config plugin or ejecting
to a prebuild. Bundle size is larger than a hand-rolled RN app.

**What would change it.** A requirement for a native SDK with no Expo config
plugin — a specific payment terminal, a proprietary health-data SDK. At that
point `expo prebuild` keeps most of the JS and gives up the managed
guarantees, which is a migration, not a rewrite.

---

## ADR-002 — MongoDB + Mongoose instead of PostgreSQL

**Status:** Accepted with debt

**Decision.** MongoDB Atlas as the datastore, accessed through Mongoose.

**Why.** The dominant write in this app is
`saveMealPlan(entireWeekPlanObject)` — a 7-day × 3-meal tree, where each meal
carries a recipe with a variable-length ingredient list, a variable-length
instruction list, and a set of fields that differ per source. In
`backend/models/MealPlan.js` that is one field:

```js
plan: { type: mongoose.Schema.Types.Mixed, required: true }
```

Modelled relationally, the same thing is four tables and a join every read,
to store a document that is only ever read and written whole. Nothing in the
app queries *into* a plan — there is no "find all users whose Tuesday lunch is
chicken." Document storage matches the actual access pattern.

Secondary reasons: Atlas has a genuinely free tier that doesn't sleep, and
Mongoose's `pre('save')` hook is where password hashing lives
(`backend/models/User.js`), which keeps hashing impossible to forget at a call
site.

**Cost accepted — and this is real.** There are no foreign keys. `Favourite`,
`CustomRecipe`, `MealPlan` and `Preferences` all carry a `userId` that nothing
in the database enforces. Deleting a user today orphans their rows silently;
correctness depends entirely on every route filtering by `req.user.id`.
`tests/integration/favourites.spec.js` and `custom-recipes.spec.js` exist
specifically because that invariant is enforced in application code rather
than by the schema — the cross-user isolation tests are the substitute for the
foreign key.

**What would change it.** Any of: a feature that queries across users
(leaderboards, "popular this week", shared plans), a reporting requirement, or
multi-document writes that must be atomic. Postgres with a `jsonb` column
would actually have given us both — the document flexibility for `plan` *and*
referential integrity — and if I were starting this again that is what I would
pick. It is filed as debt rather than fixed because migrating a live database
is not free and nothing in the current feature set is broken by it.

---

## ADR-003 — Express instead of Nest/Fastify, and an app factory

**Status:** Accepted

**Decision.** Plain Express 4, with the app split into
`backend/app.js` (factory) and `backend/server.js` (process entry).

**Why Express.** Five resource routers and one middleware. Nest's DI container
and decorators solve problems of scale this codebase does not have; Fastify's
throughput advantage is irrelevant at this traffic. Express is the smallest
thing that works and the most widely understood.

**Why the factory split — this one matters more than the framework choice.**
`server.js` calls `mongoose.connect()` and `app.listen()`. `app.js` does
neither; it only builds and returns the app. That separation is what lets
`backend/test-server.js` boot *the real application* against an in-memory
MongoDB on a throwaway port. Without it, importing the app would open a
connection to production Atlas as a side effect, and the test suite could only
ever have been mocks. **The testability of this project is a consequence of a
twelve-line file split.**

**What Express does not give you, and what we added.** Express 4 does not
catch rejected promises from async handlers — an unhandled rejection hangs the
request until it times out — and it has no opinion about turning errors into
status codes. The original code paid for both: every route carried its own
`try/catch` ending in `res.status(500)`, which turned ordinary client mistakes
into server errors. A malformed ObjectId in a URL returned 500. A missing
required field returned 500. Nothing about either is retryable, and real
faults were invisible in the noise.

Two small pieces fix it centrally:

- `backend/utils/asyncHandler.js` — one line; forwards rejections to Express's
  error pipeline. (Express 5 does this natively; this is what lets us stay
  on 4.)
- `backend/middleware/errorHandler.js` — classifies once: Mongoose
  `ValidationError` → 400, `CastError` → 400, duplicate key → 409, deliberate
  `badRequest()` / `notFound()` → their status, anything else → logged and
  returned as a generic 500 so driver text does not leak.

**Cost accepted.** Still no schema-level request validation, no structured
logging, no rate limiting. Routes hand-roll their `if (!email || !password)`
checks.

**What would change it.** Enough routes that hand-rolled validation starts
diverging — at which point `zod` middleware first, and only then a framework.

---

## ADR-004 — JWT in AsyncStorage instead of session cookies

**Status:** Accepted with debt

**Decision.** A 30-day HS256 JWT, returned at register/login, held in a module
variable in `api/backend.js` and mirrored to AsyncStorage under `@auth_user`.

**Why.** A React Native app has no cookie jar shared with a browser, and the
API is consumed from a native client on a different origin. A bearer token in
an `Authorization` header is the model that works identically on Android, iOS
and web. Statelessness also means the backend keeps no session store, so it
can restart or scale horizontally without anyone getting logged out.

**Cost accepted — three specific weaknesses, stated plainly:**

1. **AsyncStorage is not secure storage.** It is unencrypted on-device. On a
   rooted or jailbroken device the token is readable. `expo-secure-store` is
   the correct home for it and is not currently used.
2. **There is no revocation.** The token is valid for 30 days and the server
   validates it by signature alone. A leaked token cannot be invalidated
   short of rotating `JWT_SECRET`, which logs out every user at once.
3. **There is no refresh token.** 30 days is a long expiry chosen to avoid
   building refresh — a convenience trade, not a security one.

**What would change it.** Any real user data. The order of fixes is:
`expo-secure-store` first (cheapest, closes the biggest hole), then short
access token + refresh token, then a revocation list if sessions ever need to
be killed remotely.

---

## ADR-005 — TheMealDB + a hardcoded plan catalog, instead of a live LLM

**Status:** Accepted

**Decision.** Meal plans come from `WEEK_PLANS` in `api/gemini.js` — a
hardcoded cuisine × diet × day × meal catalog of dish *names* — which are then
resolved to full recipes against TheMealDB's free API.

**Why.** The file is still called `gemini.js` because the first version did
call an LLM, and it was the wrong tool. Generating a meal plan per user per
request meant: a per-request API cost for a deterministic result, multi-second
latency on the app's primary screen, an API key that cannot be kept secret in
a client bundle, and non-reproducible output that makes the plan-generation
path effectively untestable. A hardcoded catalog is free, instant,
deterministic, testable, and identical in quality — because the "creative"
part of a 7-day Pakistani vegetarian plan is a fixed list that does not need
regenerating per user.

TheMealDB then supplies what actually varies and would be tedious to author by
hand: images, ingredient lists, instructions.

**The layered fallback is the part worth defending.** `findRecipeForDish()`
tries exact name search → keyword search → cuisine-area fallback →
`stubRecipe()`. TheMealDB is a free community API with no uptime guarantee and
incomplete coverage, so *every* one of those lookups can fail. `stubRecipe()`
returns a minimally-populated recipe object so a failed lookup renders a
degraded card rather than a blank slot or a crash. **The UI has no failure
state for a missing meal because the data layer guarantees it never gets
one.**

**Cost accepted.** Adding a cuisine is manual authoring work in three places
(`WEEK_PLANS`, `ALL_CUISINES`, `CuisineBadge`). Plans do not adapt to
individual preferences beyond cuisine and diet. The filename is misleading and
should be renamed to `mealPlan.js`.

**What would change it.** Genuine personalisation — allergies, calorie
targets, "use what's in my fridge." That is a real generative problem, and the
right shape is an LLM call *server-side* behind an authenticated route, with
the response cached per (cuisine, diet, constraints) tuple so it stays
testable and doesn't bill per view.

---

## ADR-006 — Three deployment targets, deliberately split

**Status:** Accepted

**Decision.** Backend → Railway. Web build → Vercel (`vercel.json`, via
`expo export`). Android → EAS Build + EAS Update (`eas.json`).

**Why split.** They have genuinely different requirements. The backend is a
long-lived process holding a database connection pool — that needs a container
host, not a serverless function, because per-invocation Mongo connections
exhaust the Atlas connection limit under any concurrency. The web build is
static output with a SPA rewrite, which is exactly what a CDN does best and
what `vercel.json`'s catch-all `/(.*) → /index.html` route configures. The
Android app has to go through EAS because there is no other way to sign and
build it from Windows.

**Consequence that shapes the code.** Three targets means the frontend must
not hardcode a backend URL. `api/backend.js` reads
`EXPO_PUBLIC_BACKEND_URL` and falls back to the deployed Railway URL — which
is also what allows the e2e suite to point the real app at a disposable local
backend (ADR-007). Before that change the URL was a literal on line 3, and
browser e2e was impossible for exactly that reason.

**Cost accepted.** Three dashboards, three sets of credentials, three ways for
a deploy to half-succeed.

**And a cost we did not notice we were paying.** Both Vercel and Railway were
connected directly to this repo and already auto-deploying on every push to
`main`. Writing a gated `deploy.yml` did not change that — it just added a
*second* path, and the ungated one was winning: Vercel put production live
around 90 seconds before the gated workflow started. The lesson generalises
beyond this project: **a new gate does not remove the old doors.** Adding the
control is the easy half; finding what already bypasses it is the half that
actually decides whether the control means anything. Both integrations are now
off (`vercel.json`, and Railway's dashboard), and `docs/WORKFLOW.md` records
that the Railway one can be silently switched back on.

---

## ADR-007 — Two test tiers: HTTP integration + browser e2e

**Status:** Accepted

**Decision.** `tests/integration/` drives the real Express app over HTTP with
no browser. `tests/e2e/` drives the real UI in Chromium via `react-native-web`.
Both run under one Playwright config as separate projects. Both run against
`backend/test-server.js` — the real app on an in-memory MongoDB.

**Why not unit tests with mocks.** The bugs this app actually has are at
boundaries: does the auth middleware reject a malformed header, does a route
filter by `userId`, does the plan survive a save/load round-trip, does the
token still work after a page reload. A mock of Mongoose asserts that the mock
was called. Running the real app against a disposable real database asserts
that the app works.

**Why two tiers and not just e2e.** Browser tests are slow and flaky and can
only reach behaviour the UI exposes — cross-user isolation and malformed-token
handling have no UI to click. The integration tier covers the API's full
surface cheaply; the e2e tier proves the wiring between UI and API is real.
Roughly: integration for breadth, e2e for the handful of journeys that must
never break.

**It worked.** Ten integration tests were written against intended rather than
actual behaviour, marked `// EXPECTED (spec):`, and every one turned out to be
a real defect — including two delete routes that returned `{ success: true }`
while deleting nothing, so deleting *another user's* data looked like it had
succeeded. All ten are fixed; both tiers are green. Writing the assertion for
what the code *should* do, and letting it fail, is what surfaced them.

**Cost accepted.** `mongodb-memory-server` downloads a MongoDB binary on first
run (cached in CI). The Expo web export adds ~60–90s to a cold e2e run.

**What would change it.** Enough pure logic to be worth unit-testing directly —
`findRecipeForDish`'s fallback chain is the current candidate, and
`tests/integration/gemini.spec.js` covers it through the module rather than
over HTTP.

---

## ADR-008 — Guardrails as executable hooks, not documentation

**Status:** Accepted

**Decision.** The rules in `CLAUDE.md` that must never be violated are
additionally enforced as `PreToolUse` hooks in `.claude/settings.json`, and
re-checked in CI.

**Why.** A rule in a markdown file is a suggestion — to a human under time
pressure and to an AI agent alike. "Never commit directly to `main`", "never
commit a `.env`", "never use `--no-verify`" are cheap to state and expensive
to violate. A `PreToolUse` hook returning a non-zero exit code makes the
violation mechanically impossible rather than merely discouraged.

The same checks run in `.github/workflows/ci.yml`, because a hook only
protects the machine it's installed on. Local hooks make the mistake hard;
CI makes it impossible to merge.

**Cost accepted.** Hooks add latency to every matching tool call and can be
bypassed by anyone editing the settings file. They are a guardrail against
mistakes, not an attacker.

**What would change it.** Nothing about the approach. The list of rules grows
as new classes of mistake appear — each new hook should be added only after a
real near-miss, not speculatively.
