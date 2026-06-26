const router    = require('express').Router();
const auth      = require('../middleware/auth');
const Favourite = require('../models/Favourite');

// GET /api/favourites
router.get('/', auth, async (req, res) => {
  try {
    const favs = await Favourite.find({ userId: req.user.id }).sort({ savedAt: -1 });
    res.json(favs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/favourites
router.post('/', auth, async (req, res) => {
  try {
    const { recipe } = req.body;
    const fav = await Favourite.create({ userId: req.user.id, recipe });
    res.status(201).json(fav);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/favourites/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Favourite.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
