// models/eventPayment.js
const mongoose = require('mongoose');

const EventPaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentIntentId: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('EventPayment', EventPaymentSchema);
