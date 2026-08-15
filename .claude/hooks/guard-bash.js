#!/usr/bin/env node
//
// PreToolUse guard for Bash commands.
//
// This exists because a rule written in CLAUDE.md is a *suggestion*. An agent
// under instruction-following pressure — or a human in a hurry — can talk
// itself past a paragraph of prose. It cannot talk itself past a non-zero
// exit code. Anything in this file is a rule we are not willing to have
// negotiated away mid-task.
//
// Protocol: Claude Code pipes {tool_name, tool_input} as JSON on stdin.
//   exit 0 -> allow
//   exit 2 -> block; stderr is fed back to the model as the reason
//
// This is a guardrail against mistakes, not a security boundary: anyone who
// can edit this file can remove it. The same checks therefore run again in
// .github/workflows/ci.yml, where a branch cannot merge without them.

const PROTECTED_BRANCHES = ['main', 'master'];

// Each rule: what it matches, and why refusing is the right call.
const RULES = [
  {
    name: 'no-verify',
    test: cmd => /\bgit\s+(commit|push)\b/.test(cmd) && /--no-verify|(^|\s)-n(\s|$)/.test(cmd),
    reason:
      'Refusing `--no-verify`. Hooks are the last automated check before code ' +
      'leaves this machine; skipping them hides the failure rather than fixing ' +
      'it. Fix what the hook reports, or ask the user to bypass it themselves.',
  },
  {
    name: 'force-push',
    test: cmd => /\bgit\s+push\b/.test(cmd) && /(--force(?!-with-lease)|(^|\s)-f(\s|$))/.test(cmd),
    reason:
      'Refusing a plain force-push: it can silently discard commits someone ' +
      'else pushed. Use `--force-with-lease`, which fails instead of ' +
      'overwriting when the remote has moved.',
  },
  {
    name: 'hard-reset',
    test: cmd => /\bgit\s+reset\s+--hard\b/.test(cmd) || /\bgit\s+clean\s+-[a-z]*f/.test(cmd),
    reason:
      'Refusing to destroy uncommitted work. If the intent is to discard ' +
      'changes, say so explicitly and let the user run it — `git stash` keeps ' +
      'a recoverable copy and is almost always the better move.',
  },
  {
    name: 'commit-secrets',
    test: cmd =>
      /\bgit\s+add\b/.test(cmd) &&
      // `.env.example` is a template of variable *names* and is meant to be
      // committed, so it must not trip this. Everything else .env does.
      (/(^|[\s/\\'"])\.env(\.(?!example\b)[a-z.]+)?($|[\s'"])/i.test(cmd) ||
        /\.(pem|key|p12|p8|jks|keystore|mobileprovision)\b/i.test(cmd)),
    reason:
      'Refusing to stage a secrets or signing-key file. Once a credential is ' +
      'in git history, rotating it is the only real fix — removing the file in ' +
      'a later commit does not remove it from the history.',
  },
  {
    name: 'add-all-with-untracked-secrets',
    test: cmd => /\bgit\s+add\s+(-A|--all|\.)\s*$/.test(cmd),
    reason:
      'Refusing a blanket `git add`. Stage the files this change actually ' +
      'touches by name — a catch-all is how .env files, build output and ' +
      'unrelated debris end up in commits.',
  },
  {
    name: 'prod-db-from-cli',
    test: cmd => /mongosh?\s+.*mongodb\+srv:\/\//.test(cmd),
    reason:
      'Refusing to open a shell against a remote MongoDB cluster. Tests run ' +
      'against the in-memory instance from backend/test-server.js; anything ' +
      'that needs production data is a decision for the user, not the agent.',
  },
  {
    name: 'deploy-without-review',
    test: cmd =>
      /\b(vercel|eas)\s+(deploy|build|submit|update)\b/.test(cmd) ||
      /\brailway\s+(up|deploy)\b/.test(cmd),
    reason:
      'Refusing to deploy. Deployments are outward-facing and hard to undo, ' +
      'and this project deploys through CI (.github/workflows/deploy.yml) so ' +
      'that nothing ships without a green test run. If a manual deploy is ' +
      'genuinely needed, the user should run it themselves.',
  },
];

function readStdin() {
  try {
    return require('fs').readFileSync(0, 'utf8');
  } catch (_e) {
    return '';
  }
}

function block(reason) {
  console.error(reason);
  process.exit(2);
}

function main() {
  let payload;
  try {
    payload = JSON.parse(readStdin() || '{}');
  } catch (_e) {
    process.exit(0); // Never break the session over an unparseable payload.
  }

  const command = payload?.tool_input?.command;
  if (typeof command !== 'string' || !command.trim()) process.exit(0);

  for (const rule of RULES) {
    if (rule.test(command)) block(`[guard-bash: ${rule.name}] ${rule.reason}`);
  }

  // Committing straight to a protected branch. Checked last because it needs
  // to shell out, and only when the command is actually a commit.
  if (/\bgit\s+commit\b/.test(command)) {
    let branch = '';
    try {
      branch = require('child_process')
        .execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        .trim();
    } catch (_e) { /* not a repo, or git unavailable — nothing to protect */ }

    if (PROTECTED_BRANCHES.includes(branch)) {
      block(
        `[guard-bash: protected-branch] Refusing to commit directly to '${branch}'. ` +
        'Work on a branch and open a PR, so CI runs and the change is reviewable: ' +
        '`git switch -c <type>/<short-description>`.'
      );
    }
  }

  process.exit(0);
}

main();
