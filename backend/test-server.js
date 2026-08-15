// Launches the real Express app against a throwaway local MongoDB
// (mongodb-memory-server) for Playwright E2E tests. Never touches
// production data. Started by Playwright's webServer config.
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const createApp = require('./app');

const PORT = process.env.TEST_BACKEND_PORT || 4000;

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.JWT_SECRET = 'playwright-test-secret';
  await mongoose.connect(mongod.getUri());

  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`[test-server] ready on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})().catch(err => {
  console.error('[test-server] failed to start:', err);
  process.exit(1);
});
