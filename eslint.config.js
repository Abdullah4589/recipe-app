// ESLint flat config.
//
// This repo has three environments with genuinely different globals and module
// systems, so a single blanket config would either miss real errors or invent
// fake ones:
//
//   frontend  — ESM + JSX, react-native globals, runs on Hermes and in a browser
//   backend   — CommonJS, Node globals
//   tests     — CommonJS, Node globals, Playwright's own entry points
//
// Rules are chosen to catch mistakes that actually break this project, not to
// enforce a house style. Formatting is deliberately not linted — see the note
// at the bottom.

const js = require('@eslint/js');
const globals = require('globals');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'backend/node_modules/**',
      'dist/**',
      'web-build/**',
      'android/**',
      'ios/**',
      'playwright-report/**',
      'test-results/**',
      '.expo/**',
    ],
  },

  // ─── Frontend: Expo / React Native, ESM + JSX ──────────────────────────────
  {
    files: ['App.js', 'api/**/*.js', 'screens/**/*.js', 'components/**/*.js', 'context/**/*.js', 'constants/**/*.js', 'utils/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        __DEV__: 'readonly',
        // Not Node at runtime — Metro statically replaces `process.env.X`
        // with a literal at bundle time. Declaring it keeps the
        // EXPO_PUBLIC_BACKEND_URL lookup in api/backend.js from reading as
        // an undefined global.
        process: 'readonly',
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.flat.recommended.rules,

      // The new JSX transform means React need not be in scope.
      'react/react-in-jsx-scope': 'off',
      // This project does not use prop-types; it is not TypeScript either.
      // Turning this on would produce hundreds of findings and no bug fixes.
      'react/prop-types': 'off',

      // Flags apostrophes and quotes in JSX text. The rule exists because raw
      // quotes are ambiguous in HTML; here every string renders inside a React
      // Native <Text>, where there is no such ambiguity and no escaping to do.
      // Leaving it on would mean writing &apos; in ordinary English prose.
      'react/no-unescaped-entities': 'off',

      // The two rules in this file most likely to catch a real bug.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Matches the codebase's deliberate `catch (_e)` convention, which exists
      // for Hermes compatibility — bare `catch {}` is not reliably supported.
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],

      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ─── Backend + scripts: Node, CommonJS ─────────────────────────────────────
  {
    files: ['backend/**/*.js', 'scripts/**/*.js', '.claude/hooks/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      // A server with no logging is not debuggable; console is the log sink here.
      'no-console': 'off',

      // Express 4 does not catch rejected promises from async handlers, so an
      // unhandled rejection hangs the request. These make the mistake louder.
      'no-async-promise-executor': 'error',
      'require-atomic-updates': 'error',
    },
  },

  // ─── Tests: Node CommonJS ──────────────────────────────────────────────────
  {
    files: ['tests/**/*.js', 'playwright.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      // Both environments, deliberately: the spec files themselves run in
      // Node, but the callbacks passed to page.evaluate() are serialised and
      // executed inside the browser, where `window` and `localStorage` are
      // exactly the right globals to be using.
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-console': 'off',

      // A fixed sleep in an e2e test is a flake with a delay fuse. CI checks
      // for this too, but failing here means finding out in the editor.
      'no-restricted-syntax': ['error', {
        selector: "CallExpression[callee.property.name='waitForTimeout']",
        message: 'No fixed sleeps. Use toBeVisible(), expect.poll, or waitForResponse.',
      }],
    },
  },
];

// ─── Why there is no Prettier ────────────────────────────────────────────────
//
// This codebase uses deliberate column alignment throughout, e.g.
//
//   const { theme } = useTheme();
//   const colors    = useColors();
//
// Prettier would collapse every one of those and rewrite essentially every
// file. That produces a diff in the thousands of lines where the useful review
// signal — the actual behaviour changes — is buried, and it changes code that
// has no defect in it.
//
// The trade being made: consistent formatting is worth less here than a
// readable history, because this is a small codebase with one author. On a
// team, the calculation flips and Prettier is worth the one-time reformat
// commit — done on its own, listed in .git-blame-ignore-revs so it does not
// poison `git blame`.
