const router   = require('express').Router();
const auth     = require('../middleware/auth');
const MealPlan = require('../models/MealPlan');
const asyncHandler = require('../utils/asyncHandler');
const { badRequest } = require('../middleware/errorHandler');

// GET /api/meal-plan
router.get('/', auth, asyncHandler(async (req, res) => {
  const plan = await MealPlan.findOne({ userId: req.user.id });
  res.json(plan || null);
}));

// POST /api/meal-plan — upsert; one plan per user.
router.post('/', auth, asyncHandler(async (req, res) => {
  const { plan, cuisines, diet } = req.body;

  // The schema marks `plan` required, but Mongoose's update validators do not
  // reliably enforce `required` on an upsert, so an empty save silently wrote
  // a plan-less document. Checking here makes it explicit and testable.
  if (!plan) throw badRequest('A plan is required');

  const saved = await MealPlan.findOneAndUpdate(
    { userId: req.user.id },
    { plan, cuisines, diet, savedAt: new Date() },
    { upsert: true, new: true, runValidators: true }
  );
  res.json(saved);
}));

module.exports = router;
