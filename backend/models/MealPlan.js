const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  plan:     { type: mongoose.Schema.Types.Mixed, required: true },
  cuisines: [String],
  diet:     { type: String, default: 'None' },
  savedAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('MealPlan', mealPlanSchema);
