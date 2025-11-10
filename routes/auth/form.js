const express = require('express');
const axios = require('axios');
const router = express.Router();
const Form = require('../../models/form'); // Import the Mongoose schema

// WhatsApp API credentials
const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0/469441239593928/messages';
const ACCESS_TOKEN = 'EAA25TFKJnsgBOZC5IdJ8UeKu9haqHyCdceW1vziE2qqJvhLUVFCo2InJAgs8HM0ZBuLMGfHD8ZA0hy3pKRCeIvquo5tIQF43w8IsY6j0wFiXqzxhy1VE6ApbyiuvyBxm2A1qAsudsVj556ODBZCWUXLIsuhqMQgPjfZCGf0zZCq5AmGpiZCQMsYM7PeOftIO14t01prhM0jJoJE6h3ZBZAmJd4NpHTJUZD';

// POST Route: Save form data to MongoDB and send a WhatsApp message with a link
router.post('/form', async (req, res) => {
  const {
    name,
    pickupDate,
    pickupTime,
    pickupLocation,
    destination,
    passengers,
    contact,
    specialRequests,
  } = req.body;
  if (!name || !pickupDate || !pickupTime || !pickupLocation || !destination || !contact) {
    return res.status(400).send({ success: false, error: 'Required fields are missing' });
  }

  try {
    // Save form data to MongoDB
    const formData = new Form({
      name,
      pickupDate,
      pickupTime,
      pickupLocation,
      destination,
      passengers,
      contact,
      specialRequests,
    });

    const savedForm = await formData.save();
    console.log('Form saved successfully:', savedForm);

    // Send WhatsApp message with a custom link
    const message = `
      Hello ${name},\n\n
     Thank you we will notify you once we accept you r request\n\n
     Loxurya Team
     
    `;

    const response = await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: 'whatsapp',
        to: 21628232724,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('WhatsApp Message Sent:', response.data);

    res.status(200).send({
      success: true,
      message: 'Form submitted successfully and WhatsApp message sent!',
      whatsappResponse: response.data,
    });
  } catch (error) {
    if (error.response) {
      console.error('WhatsApp API Error Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    res.status(500).send({ success: false, error: 'Failed to submit form or send WhatsApp message' });
  }
});





















// POST Route: Send WhatsApp message with a link to the form
router.post('/send-message', async (req, res) => {
    const { contact } = req.body;
  
    if (!contact) {
      return res.status(400).send({ success: false, error: 'Recipient phone number is required.' });
    }
  
    try {
      const platformLink = 'http://localhost:4200/form'; // Replace with your actual form link
      const message = `
        Hello,\n\n
        Please use the link below to fill out your transfer request:\n\n
        ${platformLink}\n\n
        We look forward to serving you. Thank you!
      `;
  
      const response = await axios.post(
        WHATSAPP_API_URL,
        {
          messaging_product: 'whatsapp',
          to: contact, // E.164 format number
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      console.log('WhatsApp Message Sent:', response.data);
  
      res.status(200).send({
        success: true,
        message: 'WhatsApp message sent successfully!',
        whatsappResponse: response.data,
      });
    } catch (error) {
      if (error.response) {
        console.error('WhatsApp API Error Response:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
      res.status(500).send({ success: false, error: 'Failed to send WhatsApp message.' });
    }
  });
  
  
  














module.exports = router;




















