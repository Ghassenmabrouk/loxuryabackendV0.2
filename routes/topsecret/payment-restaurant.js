const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Restaurant = require('../../models/restaurant'); // Adjust the path

router.post('/create-restaurant-payment', async (req, res) => {
  const { restaurantId, seatsBooked, paymentMethodId, items } = req.body;

  try {
    // Validate required fields
    if (!restaurantId || !seatsBooked || seatsBooked <= 0 || !paymentMethodId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Invalid inputs provided for payment.' });
    }

    // Fetch the restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    // Ensure the restaurant has enough available seats
    if (restaurant.availableVipSeats < seatsBooked) {
      return res.status(400).json({ message: 'Not enough VIP seats available.' });
    }

    // Validate item prices (optional)
    const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount calculated.' });
    }

    // Create a Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirmation_method: 'automatic',
      payment_method_types: ['card'],
    });

    // Confirm the payment intent
    if (paymentIntent.status === 'requires_confirmation') {
      const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id);

      if (confirmedPaymentIntent.status === 'succeeded') {
        // Deduct the booked seats
        restaurant.availableVipSeats -= seatsBooked;
        await restaurant.save();

        res.status(200).json({
          message: 'Payment successful',
          clientSecret: confirmedPaymentIntent.client_secret,
        });
      } else {
        res.status(400).json({ message: 'Payment confirmation failed' });
      }
    } else {
      res.status(200).json(paymentIntent);
    }
  } catch (error) {
    console.error('Error processing restaurant payment:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;
