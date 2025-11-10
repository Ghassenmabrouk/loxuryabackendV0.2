const express = require('express');
const Hotel = require('../../models/Hotel'); // Path to the Hotel schema
const router = express.Router();

// Create a new hotel
router.post('/hotels', async (req, res) => {
  const { name, location, price, rating, image, description, amenities, rooms } = req.body;

  try {
    // Create and save the new hotel
    const newHotel = new Hotel({
      name,
      location,
      price,
      rating,
      image,
      description,
      amenities,
      rooms,
    });

    const savedHotel = await newHotel.save();
    res.status(201).json({ message: 'Hotel created successfully', hotel: savedHotel });
  } catch (error) {
    console.error('Error creating hotel:', error);
    res.status(500).json({ message: 'Error creating hotel', error });
  }
});

// Get all hotels
router.get('/hotels', async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.status(200).json(hotels);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ message: 'Error fetching hotels', error });
  }
});

// Get a single hotel by ID
router.get('/hotels/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.status(200).json(hotel);
  } catch (error) {
    console.error('Error fetching hotel:', error);
    res.status(500).json({ message: 'Error fetching hotel', error });
  }
});

// Update a hotel
router.put('/hotels/:id', async (req, res) => {
  const { id } = req.params;
  const { name, location, price, rating, image, description, amenities, rooms } = req.body;

  try {
    const updatedHotel = await Hotel.findByIdAndUpdate(
      id,
      { name, location, price, rating, image, description, amenities, rooms },
      { new: true, runValidators: true }
    );

    if (!updatedHotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.status(200).json({ message: 'Hotel updated successfully', hotel: updatedHotel });
  } catch (error) {
    console.error('Error updating hotel:', error);
    res.status(500).json({ message: 'Error updating hotel', error });
  }
});

// Delete a hotel
router.delete('/hotels/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedHotel = await Hotel.findByIdAndDelete(id);

    if (!deletedHotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.status(200).json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    console.error('Error deleting hotel:', error);
    res.status(500).json({ message: 'Error deleting hotel', error });
  }
});

module.exports = router;
