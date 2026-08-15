const router    = require('express').Router();
const auth      = require('../middleware/auth');
const Favourite = require('../models/Favourite');
const asyncHandler = require('../utils/asyncHandler');
const { badRequest, notFound } = require('../middleware/errorHandler');

// GET /api/favourites
router.get('/', auth, asyncHandler(async (req, res) => {
  const favs = await Favourite.find({ userId: req.user.id }).sort({ savedAt: -1 });
  res.json(favs);
}));

// POST /api/favourites
router.post('/', auth, asyncHandler(async (req, res) => {
  const { recipe } = req.body;
  if (!recipe) throw badRequest('A recipe is required');
  const fav = await Favourite.create({ userId: req.user.id, recipe });
  res.status(201).json(fav);
}));

// DELETE /api/favourites/:id
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  // The userId filter is the authorisation check — there are no foreign keys
  // in Mongo enforcing ownership (see docs/DECISIONS.md ADR-002), so every
  // query that touches user data has to carry it.
  const deleted = await Favourite.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  // No match means it never existed OR it belongs to someone else. Both must
  // report failure: this previously returned `{ success: true }` either way,
  // so deleting another user's favourite looked like it had worked. Returning
  // an identical 404 for both cases also avoids confirming that someone
  // else's id exists.
  if (!deleted) throw notFound('Favourite not found');

  res.json({ success: true });
}));

module.exports = router;
