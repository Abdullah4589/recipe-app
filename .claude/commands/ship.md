---
description: Pre-flight a branch for release — review, verify, release-check, then hand the deploy decision back
allowed-tools: Task, Bash, Read, Grep, Glob
---

Get the current branch to a state where shipping it is a decision rather than
a gamble. Run these in order and stop at the first gate that fails.

## 1. Confirm there is something to ship

```bash
git branch --show-current
git status --short
git diff main...HEAD --stat
```

Stop if the branch is `main` (work belongs on a branch), or if there are
uncommitted changes (they would not be in the deploy).

## 2. Review — `pr-reviewer` agent

**Gate:** no unresolved blocking findings.

## 3. Verify — `release-checker` agent

Both tiers green, web bundle builds, no secrets in the diff, env parity,
migration safety.

**Gate:** an explicit go verdict, with real command output behind each item.

## 4. Report and hand back

Summarise for the user:
- what is in this branch
- test counts from the actual run
- review findings and their resolution
- the release-checker verdict
- **what deploying will actually change** — Railway (backend), Vercel (web),
  EAS (Android), or some combination

Then stop.

**Do not deploy, push, or merge.** `.claude/hooks/guard-bash.js` blocks
`vercel` / `eas` / `railway` commands, and that is deliberate: deployment is
outward-facing and hard to reverse, it runs through
`.github/workflows/deploy.yml` gated on CI, and the decision belongs to the
user. Your output is a recommendation, not an action.
