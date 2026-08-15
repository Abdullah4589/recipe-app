#!/usr/bin/env node
//
// The mechanical half of the fix loop.
//
// An agent asked to "keep fixing until the tests pass" has two failure modes,
// and both are worse than stopping:
//
//   1. It spins — reattempting the same fix on the same failure forever,
//      burning tokens and time while nothing changes.
//   2. It escapes — the fastest way out of "make the suite green" is to
//      weaken the assertion, and a loop that only measures greenness will
//      happily accept that.
//
// So the loop is built around its *exit* conditions rather than its goal.
// This script owns the parts a model should not be trusted to do by eye:
// running the suite, extracting exactly which tests failed, and comparing
// against the previous iteration to decide whether progress was actually
// made. It never edits code — it only reports, and the caller decides.
//
// Usage:
//   node scripts/test-loop.js --project=integration
//   node scripts/test-loop.js --project=e2e --state .loop-state.json
//
// Exit codes are the loop's control flow:
//   0  GREEN       — everything passed. Stop, successfully.
//   1  PROGRESS    — still failing, but strictly fewer failures. Keep going.
//   2  NO_PROGRESS — same failure set as last time. Stop and escalate.
//   3  REGRESSION  — something that passed last time now fails. Stop.
//   4  ERROR       — the run itself could not be completed.

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXIT = { GREEN: 0, PROGRESS: 1, NO_PROGRESS: 2, REGRESSION: 3, ERROR: 4 };

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const hit = args.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const project   = argOf('project', '');
const statePath = path.resolve(argOf('state', '.loop-state.json'));
const ROOT      = path.join(__dirname, '..');
const reportPath = path.join(ROOT, 'loop-report.json');

// ─── Run the suite ───────────────────────────────────────────────────────────

function runSuite() {
  const cmd = ['playwright', 'test', '--reporter=json'];
  if (project) cmd.push(`--project=${project}`);

  const res = spawnSync('npx', cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: true, // Windows: npx is a .cmd shim and cannot be spawned directly.
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: reportPath },
  });

  // A non-zero exit is expected when tests fail — that is data, not an error.
  // Only a missing/unparseable report means the run itself broke.
  if (!fs.existsSync(reportPath)) {
    console.error('[loop] no JSON report produced. Playwright output follows:\n');
    console.error((res.stderr || res.stdout || '').slice(-4000));
    process.exit(EXIT.ERROR);
  }

  try {
    return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  } catch (_e) {
    console.error('[loop] JSON report could not be parsed.');
    process.exit(EXIT.ERROR);
  }
}

// ─── Extract failures ────────────────────────────────────────────────────────

// Playwright nests suites arbitrarily deep; flatten to the specs.
function collectSpecs(node, out = []) {
  for (const spec of node.specs || []) out.push(spec);
  for (const child of node.suites || []) collectSpecs(child, out);
  return out;
}

// Matches ANSI colour codes in Playwright error output. Constructed rather
// than written as a regex literal: a raw ESC byte in source is invisible in
// diffs and code review, and escaping it inside a literal trips
// no-control-regex.
const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');

function firstError(test) {
  for (const result of test.results || []) {
    const msg = result.error?.message || result.errors?.[0]?.message;
    if (msg) {
      // Strip ANSI and collapse to something diffable between iterations.
      return msg.replace(ANSI, '').split('\n').slice(0, 3).join(' ').trim();
    }
  }
  return '(no error message)';
}

function analyse(report) {
  // A run that could not start is not a passing run.
  //
  // Playwright reports harness-level problems (a webServer port already in
  // use, a config error, a missing dependency) in top-level `errors`, and
  // still emits a well-formed report with zero suites. Read naively, that
  // looks identical to "everything passed" — which is the single most
  // dangerous thing a loop like this can get wrong, because it exits
  // reporting success having verified nothing at all.
  if (Array.isArray(report.errors) && report.errors.length) {
    console.error('\n[loop] the test run could not start:\n');
    for (const e of report.errors) console.error(`  ${e.message}`);
    console.error('\n[loop] This is not a test failure — nothing ran. Fix the harness,');
    console.error('[loop] then re-run. (A stale server on port 4000 or 4173 is the');
    console.error('[loop] usual cause; check for another test run still going.)');
    process.exit(EXIT.ERROR);
  }

  const specs = (report.suites || []).flatMap(s => collectSpecs(s));

  if (specs.length === 0) {
    console.error('\n[loop] zero tests were executed. Refusing to report green:');
    console.error('[loop] an empty suite passes trivially and proves nothing.');
    console.error('[loop] Check the --project name and that testDir matches real files.');
    process.exit(EXIT.ERROR);
  }
  const failures = [];
  const flaky = [];

  for (const spec of specs) {
    for (const test of spec.tests || []) {
      // Playwright's own status vocabulary: 'expected' = passed,
      // 'unexpected' = failed, 'flaky' = failed then passed on retry.
      const id = `${spec.file} :: ${spec.title}`;
      if (test.status === 'unexpected') failures.push({ id, error: firstError(test) });
      else if (test.status === 'flaky') flaky.push({ id, error: firstError(test) });
    }
  }

  return {
    total: specs.length,
    failures: failures.sort((a, b) => a.id.localeCompare(b.id)),
    flaky,
  };
}

// ─── Compare against the previous iteration ──────────────────────────────────

function readState() {
  try { return JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch (_e) { return null; }
}

function writeState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function main() {
  const prev = readState();
  const iteration = (prev?.iteration || 0) + 1;

  console.log(`\n[loop] iteration ${iteration}${project ? ` (${project})` : ''}`);

  const { total, failures, flaky } = analyse(runSuite());
  const ids = failures.map(f => f.id);
  const prevIds = prev?.failureIds || [];

  console.log(`[loop] ${total} tests, ${failures.length} failing, ${flaky.length} flaky`);

  if (flaky.length) {
    // Surfaced rather than tolerated. A test that passes on retry is
    // non-deterministic, and treating that as success is how a suite quietly
    // stops meaning anything.
    console.log('\n[loop] FLAKY — passed only on retry. Do not ignore these:');
    for (const f of flaky) console.log(`  - ${f.id}\n      ${f.error}`);
  }

  writeState({ iteration, failureIds: ids, updatedAt: new Date().toISOString() });

  if (failures.length === 0) {
    console.log(`\n[loop] GREEN after ${iteration} iteration(s).`);
    try { fs.unlinkSync(statePath); } catch (_e) { /* nothing to clean up */ }
    process.exit(EXIT.GREEN);
  }

  console.log('\n[loop] FAILING:');
  for (const f of failures) console.log(`  - ${f.id}\n      ${f.error}`);

  if (!prev) {
    console.log('\n[loop] baseline recorded. Fix the failures above, then re-run.');
    process.exit(EXIT.PROGRESS);
  }

  const fixed  = prevIds.filter(id => !ids.includes(id));
  const broken = ids.filter(id => !prevIds.includes(id));

  if (broken.length) {
    console.log('\n[loop] REGRESSION — these passed last iteration and now fail:');
    for (const id of broken) console.log(`  - ${id}`);
    console.log('\n[loop] Stopping. A fix that breaks other tests is not a fix;');
    console.log('[loop] revert it and re-approach rather than layering another change.');
    process.exit(EXIT.REGRESSION);
  }

  if (fixed.length === 0) {
    console.log(`\n[loop] NO PROGRESS — identical ${ids.length} failure(s) as iteration ${prev.iteration}.`);
    console.log('[loop] Stopping. Repeating the attempt will not change the result.');
    console.log('[loop] Escalate to the user with: what you tried, why you expected it');
    console.log('[loop] to work, and what the output actually showed.');
    process.exit(EXIT.NO_PROGRESS);
  }

  console.log(`\n[loop] PROGRESS — fixed ${fixed.length}, ${ids.length} remaining.`);
  for (const id of fixed) console.log(`  fixed: ${id}`);
  process.exit(EXIT.PROGRESS);
}

main();
