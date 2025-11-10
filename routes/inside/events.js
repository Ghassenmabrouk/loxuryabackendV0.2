const express = require('express');
const Event = require('../../models/events'); // Adjust path as needed
const router = express.Router();
const fs = require('fs');
const path = require('path');
const upload = require('../../config/multer'); // Import multer configuration

// Create a new event
router.post('/add-event', upload.array('images', 10), async (req, res) => {
  console.log('Received files:', req.files); // Log uploaded files
  console.log('Received body:', req.body);   // Log form data

  if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
  }

  const {
      name,
      description,
      features,
      date,
      location,
      price,
      category,
      availableSeats,
      status,
      duration,
      discount,
      promoCode,
      tags,
      videoLink,
      bookingDetails: bookingDetailsString,
  } = req.body;

  // Parse `bookingDetails` safely
  let bookingDetails = {};
  try {
      bookingDetails = JSON.parse(bookingDetailsString || '{}');
  } catch (err) {
      return res.status(400).json({ message: 'Invalid format for bookingDetails' });
  }

  // Extract file paths from uploaded files
  const images = req.files.map(file => {
      const normalizedPath = file.path.replace(/\\/g, '/'); // Normalize path for consistent storage
      return normalizedPath; // Use normalized path for database storage
  });

  try {
      const eventDate = new Date(date);
      const startDate = new Date(bookingDetails.startDate);
      const endDate = new Date(bookingDetails.endDate);

      if (isNaN(eventDate.getTime())) {
          return res.status(400).json({ message: 'Invalid event date format' });
      }
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({ message: 'Invalid booking start or end date format' });
      }

      const maxBookings = parseInt(bookingDetails.maxBookings, 10) || 0;
      const fullyBooked = parseInt(availableSeats, 10) <= 0 || maxBookings <= 0;

      // Create new event object
      const newEvent = new Event({
          name,
          description,
          features: features ? features.split(',').map(f => f.trim()) : [],
          date: eventDate,
          location,
          price: parseFloat(price),
          category,
          availableSeats: parseInt(availableSeats, 10),
          status,
          duration: parseInt(duration, 10),
          discount: parseInt(discount, 10),
          promoCode,
          tags: tags ? tags.split(',').map(t => t.trim()) : [],
          videoLink,
          images, // Attach uploaded image paths
          bookingDetails: {
              startDate,
              endDate,
              maxBookings,
              fullyBooked,
          },
      });

      // Save event to database
      const savedEvent = await newEvent.save();
      res.status(201).json({ message: 'Event created successfully', event: savedEvent });
  } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all events
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find();

    // Prepend base URL to image paths
    const updatedEvents = events.map(event => {
      if (event.images) {
        event.images = event.images.map(img => `http://localhost:3100/${img}`);
      }
      return event;
    });

    res.status(200).json(updatedEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get an event by ID
router.get('/event/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an event
router.put('/event/:id', async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete an event
router.delete('/events/:id', async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
