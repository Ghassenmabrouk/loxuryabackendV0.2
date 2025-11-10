const express = require('express');
const Restaurant = require('../../models/restaurant'); // Adjust path as needed
const router = express.Router();

// Create a new restaurant
router.post('/add-restaurant', async (req, res) => {
  try {
    const { name, imageUrl, rating, cuisine, location, priceRange } = req.body;

    const newRestaurant = new Restaurant({
      name,
      imageUrl,
      rating: parseFloat(rating),
      cuisine,
      location,
      priceRange,
      availableVipSeats: null, // Set to null or undefined to signify unlimited seats
    });

    const savedRestaurant = await newRestaurant.save();
    res.status(201).json({ message: 'Restaurant added successfully', restaurant: savedRestaurant });
  } catch (error) {
    console.error('Error adding restaurant:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all restaurants
router.get('/restaurants', async (req, res) => {
  try {
    const restaurants = await Restaurant.find().lean();
    res.json(
      restaurants.map((restaurant) => ({
        ...restaurant,
        id: restaurant._id, // Map `_id` to `id`
      }))
    );
  } catch (err) {
    console.error('Error fetching restaurants:', err);
    res.status(500).json({ message: 'Failed to fetch restaurants' });
  }
});

// Get a restaurant by ID
router.get('/restaurant/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a restaurant
router.put('/restaurant/:id', async (req, res) => {
  try {
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRestaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.status(200).json(updatedRestaurant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a restaurant
router.delete('/restaurant/:id', async (req, res) => {
  try {
    const deletedRestaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!deletedRestaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.status(200).json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
