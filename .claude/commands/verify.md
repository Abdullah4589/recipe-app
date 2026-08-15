---
description: Run both test tiers and report what actually passed
allowed-tools: Bash, Read, Grep, Glob
---

Run the full suite and report honestly.

```bash
npm run test:integration
npm run test:e2e
```

Then report:

1. **Counts per tier** — passed / failed, taken from the real output.
2. **For each failure**, classify it:
   - **App bug** — the test asserts correct behaviour and the app is wrong.
     Hand to the `bug-fixer` agent.
   - **Test defect** — the assertion itself is wrong (e.g. selecting on an
     attribute react-native-web does not emit). Hand to `test-author`.
   - **Flake** — passes on re-run with no code change. Say so explicitly and
     name the non-deterministic thing; do not just re-run until green.
3. **A verdict.** Green, or a list of what must be fixed.

Do not fix anything in this command — `/verify` reports. Fixing is a separate,
deliberate step so the failure list stays visible.

Never describe the suite as passing without pasting the run output.
