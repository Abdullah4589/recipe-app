// Express app factory — separated from server.js so tests can require the
// app without triggering a real MongoDB connection or app.listen().
const express = require('express');
const cors    = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  app.use('/api/auth',           require('./routes/auth'));
  app.use('/api/meal-plan',      require('./routes/mealPlan'));
  app.use('/api/favourites',     require('./routes/favourites'));
  app.use('/api/custom-recipes', require('./routes/customRecipes'));
  app.use('/api/preferences',    require('./routes/preferences'));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

  // Must be registered last — Express picks error middleware by arity and
  // only reaches it after every other layer has passed.
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
