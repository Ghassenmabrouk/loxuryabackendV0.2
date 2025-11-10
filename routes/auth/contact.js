// routes/auth/contact.js

const express = require('express');
const axios = require('axios');
const Contact = require('../../models/contact');
const router = express.Router();

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

router.post('/contact', async (req, res) => {
  const { name, email, message, recaptcha } = req.body;

  // Verify reCAPTCHA
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: recaptcha,
        },
      }
    );

    const { success } = response.data;

    if (!success) {
      return res.status(400).json({ message: 'reCAPTCHA verification failed' });
    }

    // If reCAPTCHA verification is successful, save the contact form data to the database
    const newContact = new Contact({ name, email, message });
    await newContact.save();

    res.status(200).json({ message: 'Contact form submitted successfully' });
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
});

module.exports = router;
