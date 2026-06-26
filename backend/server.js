require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1); });

app.use('/api/auth',           require('./routes/auth'));
app.use('/api/meal-plan',      require('./routes/mealPlan'));
app.use('/api/favourites',     require('./routes/favourites'));
app.use('/api/custom-recipes', require('./routes/customRecipes'));
app.use('/api/preferences',    require('./routes/preferences'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
