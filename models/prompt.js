const mongoose = require('mongoose');

const promptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  prompt: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now, // Automatically set to the current date and time
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  metadata: {
    type: Map, // Flexible key-value pairs for additional data
    of: String,
    default: {},
  },
});

// Indexes for faster queries
promptSchema.index({ userId: 1 }); // Index on userId for faster lookups
promptSchema.index({ timestamp: -1 }); // Index on timestamp for sorting

module.exports = mongoose.model('Prompt', promptSchema);
