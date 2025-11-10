const mongoose = require('mongoose');

const attemptTrackerSchema = new mongoose.Schema({
  email: { type: String, required: true },
  date: { type: String, required: true }, // Date format YYYY-MM-DD
  attempts: { type: Number, required: true, default: 0 },
});

module.exports = mongoose.model('AttemptTracker', attemptTrackerSchema);
