const express = require('express');
const router = express.Router();
const PickupRequest = require('../../models/form'); // Mongoose schema
const User = require('../../models/user'); // User Schema

// GET: Fetch all pickup requests for the mobile app
router.get('/requests', async (req, res) => {
  try {
    const requests = await PickupRequest.find(); // Fetch all requests from the database
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error.message);
    res.status(500).send({ error: 'Failed to fetch requests' });
  }
});

// PUT: Update the status of a pickup request
router.put('/requests/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).send({ error: 'Status is required.' });
  }

  try {
    // Update the request status in the database
    const updatedRequest = await PickupRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Return the updated document
    );

    if (!updatedRequest) {
      return res.status(404).send({ error: 'Request not found.' });
    }

    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Error updating request:', error.message);
    res.status(500).send({ error: 'Failed to update request.' });
  }
});

// GET: Fetch specific fields from users for the mobile app
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username email phoneNumber'); // Fetch specific fields only
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).send({ error: 'Failed to fetch users' });
  }
});

// POST: Create a new pickup request
router.post('/requests', async (req, res) => {
  const { name, pickupLocation, destination, pickupDate, pickupTime, userId } = req.body;

  if (!name || !pickupLocation || !destination || !pickupDate || !pickupTime || !userId) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const newRequest = new PickupRequest({
      name,
      pickupLocation,
      destination,
      pickupDate,
      pickupTime,
      userId,
      status: 'pending', // Default status
    });

    const savedRequest = await newRequest.save();
    res.status(201).json(savedRequest);
  } catch (error) {
    console.error('Error creating pickup request:', error.message);
    res.status(500).json({ error: 'Failed to create pickup request.' });
  }
});

// GET: Fetch a specific pickup request by ID
router.get('/requests/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const request = await PickupRequest.findById(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    res.status(200).json(request);
  } catch (error) {
    console.error('Error fetching request:', error.message);
    res.status(500).json({ error: 'Failed to fetch request.' });
  }
});

module.exports = router;
