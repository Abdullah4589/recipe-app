---
description: Build a feature end to end via an agent handoff chain (test → implement → review)
argument-hint: <what to build>
allowed-tools: Task, Bash, Read, Grep, Glob, Edit, Write
---

Build this feature: **$ARGUMENTS**

Run it as an explicit handoff chain. Each stage has one job and hands a
concrete artifact to the next. Do not collapse the stages — the separation is
the point: the agent that writes the test has not yet talked itself into an
implementation, and the agent that reviews has not spent the last hour
convincing itself the code is right.

## Stage 0 — Branch (you)

Guardrails block committing to `main`, so branch first:

```bash
git switch -c feat/<short-kebab-description>
```

## Stage 1 — Specify (you)

Before delegating, write down in your reply:
- the user-visible behaviour, in one or two sentences
- which layers change (backend route / model / screen / api client)
- which tier proves it: integration for API behaviour, e2e only if it is a
  user journey crossing UI → API → DB
- anything genuinely ambiguous — ask the user *now*, not after implementing

## Stage 2 — Red tests (`test-author` agent)

Hand it the spec from Stage 1. It writes failing tests that encode the
intended behaviour and reports the failures.

**Gate:** the tests must fail for the right reason. A test that passes before
any implementation exists is testing nothing — send it back.

## Stage 3 — Implement (`bug-fixer` agent)

Hand it the failing test output. It makes them pass without editing anything
under `tests/`.

**Gate:** the whole tier is green, not just the new tests.

## Stage 4 — Review (`pr-reviewer` agent)

It reviews `git diff main...HEAD` and reports blocking / non-blocking
findings.

**Gate:** every blocking finding is resolved. If you disagree with one, say
why explicitly rather than quietly ignoring it.

## Stage 5 — Hand back (you)

Commit on the branch, then report to the user:
- what changed and why
- the real test counts from Stage 3
- what the review flagged and how it was resolved
- anything you chose not to do, and why

Do not push or open a PR unless the user asks. Do not deploy — that is
CI's job, gated on this suite.
