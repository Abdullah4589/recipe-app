# Workflow, guardrails and deployment

How work gets from an idea to production here, and which parts are enforced
rather than merely agreed.

## The layers

Guardrails sit at three levels, weakest to strongest:

| Layer | Where | Stops | Bypassable? |
|---|---|---|---|
| Documented rules | `CLAUDE.md` | Honest mistakes and drift | Yes — it's prose |
| Local hooks | `.claude/hooks/` | Mistakes at the moment they happen | Yes — edit the file |
| CI | `.github/workflows/ci.yml` | Anything reaching `main` | No, with branch protection on |

The point of the repetition is that each layer catches what the one above it
misses. Prose is the only layer that can explain *why*; CI is the only layer
that cannot be talked out of it.

## Local hooks

`.claude/settings.json` registers two `PreToolUse` hooks. Both receive the
pending tool call as JSON on stdin and exit 2 to block, with stderr fed back
to the agent as the reason.

**`guard-bash.js`** — blocks `--no-verify`, plain `--force` pushes,
`git reset --hard` / `git clean -f`, staging `.env` or signing keys, blanket
`git add -A`, `mongosh` against a remote cluster, any `vercel` / `eas` /
`railway` deploy command, and committing directly to `main`.

**`guard-write.js`** — blocks writing `.env` files, `node_modules/`, build
output and `package-lock.json`; and blocks writing content matching a
credential shape (Mongo URI with password, AWS key id, Google API key, GitHub
token, private key block, hardcoded `JWT_SECRET`).

Verify them without waiting for an agent session:

```bash
echo '{"tool_input":{"command":"git commit -m x --no-verify"}}' | node .claude/hooks/guard-bash.js; echo "exit=$?"   # expect 2
echo '{"tool_input":{"command":"npm test"}}'                    | node .claude/hooks/guard-bash.js; echo "exit=$?"   # expect 0
```

Both are guardrails against mistakes, not security boundaries — anyone who can
edit the hook can remove it. That is exactly why the same checks run in CI.

## Agents

Four agents in `.claude/agents/`, with deliberately non-overlapping authority:

| Agent | May edit | May not |
|---|---|---|
| `test-author` | `tests/`, plus adding testIDs | Application logic |
| `bug-fixer` | Application code | Anything under `tests/` |
| `pr-reviewer` | Nothing | — reports only |
| `release-checker` | Nothing | — never deploys |

**The separation is the mechanism, not bureaucracy.** An agent that writes a
test and then makes it pass has an obvious escape hatch: reshape the test until
the code it already wrote is correct. Splitting the roles removes the hatch —
`bug-fixer` cannot touch `tests/`, so the only way to green is to fix the code.

Chained by `/feature <description>`: specify → red tests → implement → review,
with a gate between each stage.

## Branch protection

The workflows only bite once GitHub is configured to require them. In
**Settings → Branches → Add rule** for `main`:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass — select **`CI passed`**
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

`CI passed` is a single aggregate job that fails if any of `guardrails`,
`integration` or `e2e` did not succeed. Requiring that one check means adding a
job later does not mean reconfiguring the protection rule — a real failure mode,
since a newly added job is not required by default and its failures are
invisible to the merge button.

Then **Settings → Environments → production**: add required reviewers so a
deploy waits for a human, and store `RAILWAY_TOKEN`, `VERCEL_TOKEN`,
`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` there rather than as plain repo secrets.

## CI

Runs on every PR and every push to `main`.

1. **`guardrails`** (~30s) — secret scan of added lines only, no tracked `.env`,
   `api/backend.js` still reads `EXPO_PUBLIC_BACKEND_URL`, no `.skip` / `.only`
   in `tests/`. Cheap checks first so an obvious mistake fails fast.
2. **`integration`** — `--project=integration`. MongoDB binary cached.
3. **`e2e`** — `--project=e2e` with Chromium. Uploads traces, screenshots and
   video on failure; a browser failure is close to undebuggable from a log line.
4. **`ci-passed`** — the aggregate gate.

The secret scan matches **added lines only**. Scanning the whole diff would mean
a commit that *removes* a secret fails forever.

## Deploys

`deploy.yml` triggers on `workflow_run` — it cannot start until CI has finished
and succeeded on that commit. It does not re-run the tests itself, on purpose:
duplicated test steps in a deploy workflow can be shortened later, quietly
removing the gate. Depending on CI's conclusion makes that impossible.

| Target | Trigger | Gate |
|---|---|---|
| Railway (backend) | CI green on `main` | `production` environment + health smoke test |
| Vercel (web) | after backend succeeds | `production` environment |
| EAS (Android) | **manual only** | human decision |

Backend deploys before web because the web bundle inlines the backend URL at
build time and will call the new API the moment it loads.

Android is not automated deliberately: an EAS Update ships JS to installed apps
immediately, with no review and no staged rollout configured. A bad update
reaches every user at once with no fast way back. Until there is a rollout
strategy, that stays a human decision:

```bash
eas update --branch main --message "<what changed>"
eas build  --platform android --profile production
```

## Day to day

```bash
git switch -c feat/short-description

npm run test:integration      # fast; run constantly
npm run test:e2e              # slow; run before pushing
npm run test                  # both

E2E_SKIP_BUILD=1 npm run test:e2e   # reuse dist/ while iterating on specs
npm run test:report                 # open the last HTML report
```

`E2E_SKIP_BUILD=1` skips the Expo web export and reuses whatever is in `dist/`.
Fine while editing test files; **wrong after changing app code**, because you
would be testing the previous build. When in doubt, leave it off.
