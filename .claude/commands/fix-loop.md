---
description: Iterate test-run → diagnose → fix → re-run until green, with hard stop conditions
argument-hint: [integration|e2e] (default: integration)
allowed-tools: Task, Bash, Read, Grep, Glob, Edit
---

Drive the suite to green by iterating, and **stop when the loop says stop**.

Tier: **$ARGUMENTS** (default `integration`).

## The loop

```bash
node scripts/test-loop.js --project=<tier>
```

Its exit code is the control flow. Do not second-guess it:

| Exit | Meaning | What you do |
|---|---|---|
| `0` | GREEN | Stop. Report success with the counts. |
| `1` | PROGRESS | Fix the listed failures, re-run. |
| `2` | NO_PROGRESS | **Stop and escalate.** Identical failures to last iteration. |
| `3` | REGRESSION | **Stop.** Revert the last change, then escalate. |
| `4` | ERROR | **Stop.** The run itself broke — report the output. |

## Hard limits

- **Maximum 5 iterations.** If not green by then, stop and report — regardless
  of whether progress is still being made. A loop without a ceiling is not a
  loop, it is a runaway.
- **Stop immediately on exit 2 or 3.** Do not "try one more thing". The script
  has already established that the last attempt changed nothing, or made
  things worse.
- **One coherent change per iteration.** Fixing four unrelated failures in one
  pass means that when the count moves you cannot tell which change did it.

## What you may not do to get green

This is the part that matters, because it is the shortest path out of the loop
and it is always available:

- Do not edit anything under `tests/`. Delegate fixes to the **`bug-fixer`**
  agent, which does not have write access to `tests/` — the loop's integrity
  comes from that restriction, not from willpower.
- Do not widen an assertion, `.skip` a test, add a retry, or mock out a real
  call.
- Do not treat a flaky test as passing. If `test-loop.js` reports FLAKY, that
  test is non-deterministic and that is a finding, not noise. Name the source
  of the non-determinism.

If the only way you can see to reach green is one of the above, that is the
signal that the test is right and the code is wrong in a way you have not
understood yet. Stop and say so.

## Each iteration

1. Run the loop script. Read the actual failure list.
2. For each failure, decide: **app bug** (→ `bug-fixer`) or **test defect**
   (→ stop; only the user or `test-author` may change tests, and a test defect
   is worth a conversation, not an automatic edit).
3. Apply exactly one coherent change.
4. Re-run. Let the exit code decide whether to continue.

## When you stop

Report, whatever the outcome:

- Final state: green, or the exact remaining failures
- How many iterations it took
- What each change was and why
- For an escalation (exit 2/3): what you tried, why you expected it to work,
  and what the output actually showed instead — that difference is the useful
  part, not the list of attempts

Never report green without pasting the run that shows it.
