const router       = require('express').Router();
const auth         = require('../middleware/auth');
const CustomRecipe = require('../models/CustomRecipe');
const asyncHandler = require('../utils/asyncHandler');
const { notFound } = require('../middleware/errorHandler');

// GET /api/custom-recipes
router.get('/', auth, asyncHandler(async (req, res) => {
  const recipes = await CustomRecipe.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(recipes);
}));

// POST /api/custom-recipes
router.post('/', auth, asyncHandler(async (req, res) => {
  // `userId` is set from the verified token and spread last so a caller can't
  // override it by putting their own userId in the body.
  const recipe = await CustomRecipe.create({ ...req.body, userId: req.user.id });
  res.status(201).json(recipe);
}));

// PUT /api/custom-recipes/:id
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const { userId: _ignored, ...updates } = req.body;
  const recipe = await CustomRecipe.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    updates,
    { new: true, runValidators: true }
  );
  if (!recipe) throw notFound('Recipe not found');
  res.json(recipe);
}));

// DELETE /api/custom-recipes/:id
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const deleted = await CustomRecipe.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });
  // See favourites.js — a no-match must not report success.
  if (!deleted) throw notFound('Recipe not found');
  res.json({ success: true });
}));

module.exports = router;
