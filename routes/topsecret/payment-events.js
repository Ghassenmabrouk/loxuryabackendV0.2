const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const EventPayment = require('../../models/payment');
const Event = require('../../models/events');

router.post('/create-event-payment', async (req, res) => {
  const { eventId, seatsBooked, paymentMethodId } = req.body;

  try {
    // Fetch event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.availableSeats < seatsBooked) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    // Calculate amount based on seats booked and event price
    const amount = event.price * seatsBooked;

    // Access user details from `req.user` (assuming authentication middleware)
    const { id: userId, email } = req.user;

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Amount in cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirmation_method: 'automatic',
      payment_method_types: ['card'],
    });

    if (paymentIntent.status === 'requires_confirmation') {
      const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id);

      if (confirmedPaymentIntent.status === 'succeeded') {
        // Save payment details in the database
        const eventPayment = new EventPayment({
          userId,
          email,
          amount,
          currency: 'usd',
          paymentIntentId: confirmedPaymentIntent.id,
          status: confirmedPaymentIntent.status,
          eventId,
          seatsBooked,
        });

        const savedPayment = await eventPayment.save();

        // Update the event's available seats
        event.availableSeats -= seatsBooked;
        if (event.availableSeats === 0) {
          event.bookingDetails.fullyBooked = true;
        }
        await event.save();

        res.status(200).json({
          message: 'Payment processed successfully',
          clientSecret: confirmedPaymentIntent.client_secret,
          payment: savedPayment,
          event,
        });
      } else {
        res.status(400).json({
          message: 'Payment confirmation failed',
          status: confirmedPaymentIntent.status,
        });
      }
    } else {
      res.status(200).json(paymentIntent);
    }
  } catch (error) {
    console.error('Error processing event payment:', error);
    res.status(500).json({ message: 'Failed to process event payment', error: error.message });
  }
});

module.exports = router;
