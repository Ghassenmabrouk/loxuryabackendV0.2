const express = require('express');
const router = express.Router();
const User = require('../../models/user'); // Ensure correct model path
const Event = require('../../models/events'); // Adjust path as needed



router.post('/book-event', async (req, res) => {
    const { eventId, userId } = req.body;
  
    try {
      const event = await Event.findById(eventId);
      const user = await User.findById(userId);
  
      if (!event || !user) {
        return res.status(404).json({ message: 'Event or User not found' });
      }
  
      if (event.availableSeats <= 0) {
        return res.status(400).json({ message: 'No available seats for this event' });
      }
  
      event.bookedBy = user._id;
      event.availableSeats -= 1; // Decrease available seats
      await event.save();
  
      res.json({ message: 'Event booked successfully', event });
    } catch (error) {
      console.error('Error booking event:', error);
      res.status(500).json({ message: 'Failed to book event', error: error.message });
    }
  });
  

  module.exports = router;
