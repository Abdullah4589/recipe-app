const router   = require('express').Router();
const auth     = require('../middleware/auth');
const MealPlan = require('../models/MealPlan');

// GET /api/meal-plan
router.get('/', auth, async (req, res) => {
  try {
    const plan = await MealPlan.findOne({ userId: req.user.id });
    res.json(plan || null);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/meal-plan
router.post('/', auth, async (req, res) => {
  try {
    const { plan, cuisines, diet } = req.body;
    const saved = await MealPlan.findOneAndUpdate(
      { userId: req.user.id },
      { plan, cuisines, diet, savedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(saved);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
