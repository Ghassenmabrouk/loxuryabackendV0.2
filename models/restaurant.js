const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  cuisine: { type: String, required: true },
  location: { type: String, required: true },
  priceRange: { type: String, required: true },
  availableVipSeats: { type: Number,default: null },
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);
