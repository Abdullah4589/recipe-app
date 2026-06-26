const mongoose = require('mongoose');

const preferencesSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  cuisines: { type: [String], default: [] },
  diet:     { type: String, default: 'None' },
}, { timestamps: true });

module.exports = mongoose.model('Preferences', preferencesSchema);
