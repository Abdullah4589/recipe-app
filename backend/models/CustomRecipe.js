const mongoose = require('mongoose');

const customRecipeSchema = new mongoose.Schema({
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:          { type: String, required: true },
  cuisine:        { type: String, default: '' },
  readyInMinutes: { type: Number, default: null },
  servings:       { type: Number, default: 4 },
  image:          { type: String, default: null },
  diets:          [String],
  ingredients: [{
    name:        String,
    amount:      Number,
    unit:        String,
    displayText: String,
  }],
  steps: [{
    number: Number,
    step:   String,
  }],
}, { timestamps: true });

module.exports = mongoose.model('CustomRecipe', customRecipeSchema);
