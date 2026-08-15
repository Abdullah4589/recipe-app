## What and why

<!-- What changes, and what problem it solves. The diff already shows *what*;
     spend the words on *why*. -->

## How it was verified

<!-- Paste the real counts. "Tests pass" without output is not evidence. -->

- [ ] `npm run test:integration` — __ passed, __ failed
- [ ] `npm run test:e2e` — __ passed, __ failed
- [ ] Manually checked in the running app (say which screen, and on web or device)

## Checklist

- [ ] No secrets, tokens, connection strings or signing keys in the diff
- [ ] Any new `process.env.X` is documented in `.env.example`
- [ ] Every query touching user data filters by `req.user.id`, and a no-match
      returns 404 rather than reporting success
- [ ] New route → integration test; new user journey → e2e test
- [ ] No test was deleted, `.skip`ped, or had an assertion widened to go green
- [ ] Async Express handlers are wrapped in `asyncHandler`
- [ ] New interactive elements have `testID` + `accessibilityRole` /
      `accessibilityLabel`

## Deployment impact

<!-- Delete what does not apply. -->

- **Backend (Railway):** no change / redeploys on merge
- **Web (Vercel):** no change / redeploys on merge
- **Android (EAS):** no change / needs a manual `eas update` or build

**Schema change?** If a Mongoose schema changed, say what happens to documents
already in the database. There is no migration framework here — making an
existing field `required` breaks reads of every document written before it.

**New environment variable?** Name it here and confirm it is set on the target
before merging. A missing variable fails at runtime, not at build time.

## Anything left undone

<!-- Known gaps, follow-ups, things deliberately out of scope. Say it here
     rather than letting a reviewer discover it. -->
