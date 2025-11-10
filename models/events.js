const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  features: { type: [String], required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  images: { type: [String] }, // Correct naming for an array of image paths
  category: { type: String, required: true },
  availableSeats: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Active', 'Cancelled', 'Coming Soon', 'Completed'], default: 'Active' },
  bookingDetails: {
    startDate: { type: Date },
    endDate: { type: Date },
    maxBookings: { type: Number },
    fullyBooked: { type: Boolean, default: false },
  },
  discount: { type: Number, min: 0, max: 100 },
  promoCode: { type: String },
  tags: { type: [String] },
  duration: { type: Number, required: true, min: 0 },
  videoLink: { type: String },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Add this field
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
