const router      = require('express').Router();
const auth        = require('../middleware/auth');
const Preferences = require('../models/Preferences');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/preferences
router.get('/', auth, asyncHandler(async (req, res) => {
  const prefs = await Preferences.findOne({ userId: req.user.id });
  res.json(prefs || null);
}));

// PUT /api/preferences — upsert; one row per user.
router.put('/', auth, asyncHandler(async (req, res) => {
  const { cuisines, diet } = req.body;
  const prefs = await Preferences.findOneAndUpdate(
    { userId: req.user.id },
    { cuisines, diet },
    { upsert: true, new: true, runValidators: true }
  );
  res.json(prefs);
}));

module.exports = router;
