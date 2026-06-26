const router       = require('express').Router();
const auth         = require('../middleware/auth');
const CustomRecipe = require('../models/CustomRecipe');

// GET /api/custom-recipes
router.get('/', auth, async (req, res) => {
  try {
    const recipes = await CustomRecipe.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/custom-recipes
router.post('/', auth, async (req, res) => {
  try {
    const recipe = await CustomRecipe.create({ ...req.body, userId: req.user.id });
    res.status(201).json(recipe);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PUT /api/custom-recipes/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const recipe = await CustomRecipe.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json(recipe);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/custom-recipes/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await CustomRecipe.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
