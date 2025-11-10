const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: { type: [String], required: false },
  vipRequirement: { type: String, required: true },
  duration: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
  status: {
    type: String,
    default: 'Coming Soon', // Default status
    enum: ['Expired', 'Coming Soon', 'Live'],
  },
});

// Virtual property to calculate the status dynamically
newsSchema.virtual('currentStatus').get(function() {
  const currentDate = new Date();

  if (currentDate < this.duration.start) {
    return 'Coming Soon'; // Event has not started yet
  } else if (currentDate > this.duration.end) {
    return 'Expired'; // Event has ended
  } else {
    return 'Live'; // Event is ongoing
  }
});

// Optionally, use a pre-save hook to update the status before saving
newsSchema.pre('save', function(next) {
  const currentDate = new Date();

  if (currentDate < this.duration.start) {
    this.status = 'Coming Soon';
  } else if (currentDate > this.duration.end) {
    this.status = 'Expired';
  } else {
    this.status = 'Live';
  }

  next();
});

const News = mongoose.model('News', newsSchema);
module.exports = News;
