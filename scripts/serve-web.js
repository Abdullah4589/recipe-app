#!/usr/bin/env node
//
// Builds the Expo web bundle and serves it as a static SPA for the e2e suite.
//
// Why a static export rather than `expo start --web`:
//   - It is the *same artifact Vercel deploys*, so e2e exercises what ships
//     rather than a dev server with different bundling and no minification.
//   - Metro's dev server compiles lazily on first request, which makes the
//     first page load slow and its duration unpredictable — the classic source
//     of flaky "why did this time out only in CI" e2e failures.
//   - No websocket/HMR client reconnecting mid-test.
//
// The trade is an up-front build. Set E2E_SKIP_BUILD=1 to reuse an existing
// dist/ while iterating on tests locally.
//
// Zero dependencies on purpose: adding a static-server package to ship one
// route table and a MIME map is not worth the supply-chain surface.

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PORT     = Number(process.env.E2E_WEB_PORT || 4173);
const DIST     = path.join(__dirname, '..', 'dist');
const INDEX    = path.join(DIST, 'index.html');
const BACKEND  = process.env.EXPO_PUBLIC_BACKEND_URL
  || `http://localhost:${process.env.TEST_BACKEND_PORT || 4000}/api`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map':  'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf',
};

function build() {
  if (process.env.E2E_SKIP_BUILD === '1' && fs.existsSync(INDEX)) {
    console.log('[serve-web] E2E_SKIP_BUILD=1 and dist/ exists — reusing it.');
    return;
  }

  console.log(`[serve-web] exporting web bundle (backend: ${BACKEND})…`);

  // EXPO_PUBLIC_* is inlined at bundle time, so it has to be set for the
  // export, not for the server. This is the whole reason api/backend.js reads
  // it from env instead of hardcoding a URL (docs/DECISIONS.md ADR-006).
  const result = spawnSync(
    'npx',
    ['expo', 'export', '--platform', 'web', '--output-dir', 'dist', '--clear'],
    {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, EXPO_PUBLIC_BACKEND_URL: BACKEND },
      // Required on Windows: since the CVE-2024-27980 fix, Node refuses to
      // spawn a .cmd shim (which is what `npx` is there) without a shell.
      shell: true,
    }
  );

  if (result.status !== 0) {
    console.error('[serve-web] expo export failed');
    process.exit(result.status || 1);
  }
}

function serve() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

    // Resolve inside dist and confirm the result is still inside dist —
    // otherwise `GET /../../.env` walks out of the served directory.
    const candidate = path.resolve(DIST, '.' + urlPath);
    const inDist = candidate === DIST || candidate.startsWith(DIST + path.sep);

    let filePath = INDEX;
    if (inDist && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      filePath = candidate;
    }
    // Anything else falls through to index.html — the SPA rewrite, matching
    // the catch-all route in vercel.json so routing behaves the same here as
    // in production.

    const body = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  });

  server.listen(PORT, () => {
    console.log(`[serve-web] ready on http://localhost:${PORT}`);
  });

  const shutdown = () => { server.close(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

build();
if (!fs.existsSync(INDEX)) {
  console.error(`[serve-web] no build output at ${INDEX}`);
  process.exit(1);
}
serve();
