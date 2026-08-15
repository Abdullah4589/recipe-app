#!/usr/bin/env node
//
// PreToolUse guard for Write / Edit.
//
// Two jobs:
//   1. Never let a real secret be written into a tracked file. A committed
//      credential has to be rotated, not deleted — the history keeps it.
//   2. Never let generated or vendored output be hand-edited, because the
//      next build silently reverts it and the "fix" quietly disappears.
//
// See guard-bash.js for the hook protocol and the reasoning behind enforcing
// rules as code rather than prose.

const path = require('path');

// Files that must never be created or modified by the agent.
const FORBIDDEN_PATHS = [
  {
    match: p => /(^|[/\\])\.env(\.|$)/.test(p) && !/\.example$/.test(p),
    reason:
      'Refusing to write a .env file. Real credentials belong only on the ' +
      'machine that needs them. Add the *name* of the new variable to ' +
      '.env.example and tell the user what to set it to.',
  },
  {
    match: p => /(^|[/\\])node_modules[/\\]/.test(p),
    reason: 'Refusing to edit node_modules — the next install reverts it. Patch upstream or use a resolution.',
  },
  {
    match: p => /(^|[/\\])(dist|web-build|android|ios)[/\\]/.test(p),
    reason: 'Refusing to edit build output. Change the source that generates it.',
  },
  {
    match: p => /package-lock\.json$/.test(p),
    reason: 'Refusing to hand-edit package-lock.json. Let npm regenerate it via `npm install`.',
  },
];

// Credential shapes that must never be hardcoded into source. Deliberately
// narrow — a rule that fires on every string containing "key" gets disabled
// within a day, and a disabled rule protects nothing.
const SECRET_PATTERNS = [
  { name: 'MongoDB connection string with credentials', re: /mongodb(\+srv)?:\/\/[^\s:'"]+:[^\s@'"]+@/i },
  { name: 'AWS access key id',                          re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Google API key',                             re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: 'GitHub token',                               re: /\bgh[pousr]_[0-9A-Za-z]{36,}\b/ },
  { name: 'OpenAI-style API key',                       re: /\bsk-[A-Za-z0-9]{32,}\b/ },
  { name: 'private key block',                          re: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  {
    name: 'hardcoded JWT_SECRET',
    // Allows the obvious throwaways used by the test harness.
    re: /JWT_SECRET\s*[:=]\s*['"](?!.*(test|example|changeme|placeholder|your[-_]?secret))[^'"]{8,}['"]/i,
  },
];

function readStdin() {
  try { return require('fs').readFileSync(0, 'utf8'); } catch (_e) { return ''; }
}

function block(reason) {
  console.error(reason);
  process.exit(2);
}

function main() {
  let payload;
  try { payload = JSON.parse(readStdin() || '{}'); } catch (_e) { process.exit(0); }

  const input    = payload?.tool_input || {};
  const filePath = input.file_path || input.notebook_path || '';
  if (!filePath) process.exit(0);

  const rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

  for (const rule of FORBIDDEN_PATHS) {
    if (rule.match(rel) || rule.match(filePath)) {
      block(`[guard-write: forbidden-path] ${rule.reason}\n  path: ${rel}`);
    }
  }

  // Everything the tool is about to put on disk.
  const content = [input.content, input.new_string, input.new_source]
    .filter(v => typeof v === 'string')
    .join('\n');
  if (!content) process.exit(0);

  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(content)) {
      block(
        `[guard-write: secret] Refusing to write what looks like a ${name} into ${rel}.\n` +
        'Read it from process.env instead, and document the variable in .env.example. ' +
        'If this is a false positive, the user can adjust the pattern in ' +
        '.claude/hooks/guard-write.js.'
      );
    }
  }

  process.exit(0);
}

main();
