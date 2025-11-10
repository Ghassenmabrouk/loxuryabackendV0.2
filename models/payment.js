const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  fullName: { type: String},
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  paymentIntentId: { type: String, required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  items: [
    {
      name: { type: String, required: true }, // Name of the item or service
      quantity: { type: Number, default:1 }, 
      price: { type: Number, required: true } // Price per unit
    }
  ]
});

module.exports = mongoose.model('Payment', PaymentSchema);
