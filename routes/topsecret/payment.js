const express = require('express');
const Payment = require('../../models/payment'); // Ensure the correct path to your model
const router = express.Router();
// Initialize Stripe with secret key from env. Fail fast with a clear error if missing.
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('Missing required environment variable: STRIPE_SECRET_KEY. Please set STRIPE_SECRET_KEY in your deployment environment (Render / Heroku / etc.).');
  // Exit early so the process doesn't continue in a broken state
  process.exit(1);
}
const stripe = require('stripe')(stripeSecretKey); // Initialize Stripe with secret key
const pdf = require('pdfkit'); // For generating PDF files
const path = require('path'); // Include the missing module
const fs = require('fs');
const User = require('../../models/user'); // Adjust the path to your user model
const Event = require('../../models/events'); // Adjust the path to your Event model
const EventPayment = require('../../models/eventpayment'); // Adjust path as needed

// Modify the POST payment route to update VIP plan
router.post('/create-payment', async (req, res) => {
  const { amount, paymentMethodId, items } = req.body;

  try {
    // Access user from req.user
    const { id: userId, email, fullName } = req.user;
console.log('Accessing user',req.user);
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
        const payment = new Payment({
          userId, // Reference to the user
          fullName,
          email,
          amount,
          currency: 'usd',
          paymentIntentId: confirmedPaymentIntent.id,
          status: confirmedPaymentIntent.status,
          items,
        });

        const savedPayment = await payment.save();

        // Update user's VIP plan
        const vipPlan = items[0].name.replace(' VIP', '').toLowerCase();
        const user = await User.findByIdAndUpdate(
          userId,
          { vipAccess: vipPlan, vipExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
          { new: true }
        );

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
          message: 'Payment processed successfully',
          clientSecret: confirmedPaymentIntent.client_secret,
          payment: savedPayment,
          user, // Return updated user info
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
    console.error('Stripe API Error:', error);
    res.status(500).json({ message: 'Failed to create payment', error: error.message });
  }
});


// Retrieve all payments
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find();
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retrieve a payment by ID
router.get('/payment/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment status
router.put('/payment/:id', async (req, res) => {
  const { status } = req.body;

  try {
    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json(updatedPayment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a payment
router.delete('/payment/:id', async (req, res) => {
  try {
    const deletedPayment = await Payment.findByIdAndDelete(req.params.id);
    if (!deletedPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});








// Generate a facture (PDF or JSON) for a payment
router.get('/generate-facture/:paymentId', async (req, res) => {
  const { paymentId } = req.params;

  try {
    // Fetch the payment details
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Create a PDF facture
    const doc = new pdf();
    const facturePath = path.join(__dirname, `../../factures/facture-${paymentId}.pdf`);
    const writeStream = fs.createWriteStream(facturePath);

    // Pipe PDF to file and response
    doc.pipe(writeStream);

    // Add Facture Content
    doc
      .fontSize(20)
      .text('Facture', { align: 'center' })
      .moveDown();

    doc
      .fontSize(14)
      .text(`Facture ID: ${paymentId}`)
      .text(`Full Name: ${payment.fullName}`)
      .text(`Email: ${payment.email}`)
      .text(`Amount: ${payment.amount} ${payment.currency.toUpperCase()}`)
      .text(`Status: ${payment.status}`)
      .text(`Date: ${new Date(payment.createdAt).toLocaleString()}`)
      .moveDown();

    doc
      .fontSize(12)
      .text('Thank you for your payment!', { align: 'center' });

    // Finalize PDF
    doc.end();

    // Wait for the PDF file to be written
    writeStream.on('finish', () => {
      // Send the PDF file as a download
      res.download(facturePath, `facture-${paymentId}.pdf`, (err) => {
        if (err) {
          console.error('Error downloading facture:', err);
          res.status(500).json({ message: 'Failed to generate facture' });
        } else {
          console.log(`Facture generated: ${facturePath}`);
        }
      });
    });
  } catch (error) {
    console.error('Error generating facture:', error);
    res.status(500).json({ message: 'Failed to generate facture', error: error.message });
  }
});



// Create Event Payment
router.post('/create-event-payment', async (req, res) => {
  const { eventId, fullName, email, items, paymentMethodId } = req.body;

  try {
    // Fetch the event to validate and calculate amount
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.availableSeats <= 0) {
      return res.status(400).json({ message: 'No seats available for this event.' });
    }

    // Calculate total seats to book
    const seatsToBook = items.reduce((total, item) => total + item.quantity, 0);

    if (seatsToBook > event.availableSeats) {
      return res.status(400).json({
        message: `Only ${event.availableSeats} seats are available. Cannot book ${seatsToBook} seats.`,
      });
    }

    // Calculate total amount (in cents for Stripe)
    const amount = items.reduce((total, item) => total + item.price * item.quantity, 0) * 100;

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      payment_method_types: ['card'],
    });

    // Confirm the payment intent
    const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id);

    if (confirmedPaymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment confirmation failed.' });
    }

    // Save payment details in the database
    const eventPayment = new EventPayment({
      userId: req.user.id, // Assuming user is authenticated and added to req by middleware
      eventId,
      fullName,
      email,
      amount: amount / 100, // Convert back to dollars
      paymentIntentId: confirmedPaymentIntent.id,
      status: confirmedPaymentIntent.status,
    });

    const savedPayment = await eventPayment.save();

    // Update event availability
    event.availableSeats -= seatsToBook; // Reduce seats by the total booked quantity
    if (event.availableSeats === 0) {
      event.bookingDetails = { fullyBooked: true };
    }
    await event.save();

    res.status(200).json({
      message: 'Payment processed successfully',
      payment: savedPayment,
      event,
    });
  } catch (error) {
    console.error('Error processing event payment:', error);
    res.status(500).json({ message: 'Failed to process event payment', error: error.message });
  }
});

module.exports = router;
