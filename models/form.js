const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupDate: { type: String, required: true },
  pickupTime: { type: String, required: true },
  pickupLocation: {
    coordinates: { type: String, required: true },
    locationName: { type: String, default: '' },
  },
  destinations: [
    {
      location: { type: String, required: true }, // Coordinates
      destinationName: { type: String, default: '' }, // Human-readable name
      stoppingTime: { type: String, default: null }, // Time spent at the destination
    },
  ],
  passengers: { type: Number, default: 1 },
  contact: { type: String, required: true },
  specialRequests: { type: String, default: '' },
  carMake: { type: String, default: 'Any' }, // Add default carMake
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'ended', 'cancelled'],
    default: 'pending',
    required: true,
  },
  driverDetails: {
    idCard: { type: String, default: null },
    name: { type: String, default: null },
    car: {
      model: { type: String, default: null },
      licensePlate: { type: String, default: null },
      class: { type: String, default: null },
    },
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Form', formSchema);
