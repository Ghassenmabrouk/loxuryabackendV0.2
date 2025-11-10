const mongoose = require('mongoose');

const savedLocationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  type: { 
    type: String, 
    enum: ['home', 'work', 'favorite', 'other'],
    default: 'other'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SavedLocation', savedLocationSchema);
