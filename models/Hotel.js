const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  image: { type: String, required: true },
  description: { type: String },
  amenities: [
    {
      icon: { type: String, required: true },
      name: { type: String, required: true },
    },
  ],
  rooms: { type: Number, required: true },
}, { timestamps: true });

// Check if model already exists before defining it
const Hotel = mongoose.models.Hotel || mongoose.model('Hotel', HotelSchema);

module.exports = Hotel;
