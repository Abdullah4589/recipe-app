const router      = require('express').Router();
const auth        = require('../middleware/auth');
const Preferences = require('../models/Preferences');

// GET /api/preferences
router.get('/', auth, async (req, res) => {
  try {
    const prefs = await Preferences.findOne({ userId: req.user.id });
    res.json(prefs || null);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/preferences
router.put('/', auth, async (req, res) => {
  try {
    const { cuisines, diet } = req.body;
    const prefs = await Preferences.findOneAndUpdate(
      { userId: req.user.id },
      { cuisines, diet },
      { upsert: true, new: true }
    );
    res.json(prefs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
