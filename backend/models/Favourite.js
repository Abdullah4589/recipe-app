const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipe:  { type: mongoose.Schema.Types.Mixed, required: true },
  savedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Favourite', favouriteSchema);
