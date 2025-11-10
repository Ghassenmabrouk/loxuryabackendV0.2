const express = require('express');
const router = express.Router();
const SavedLocation = require('../../models/SavedLocation');
const axios = require('axios');

// Google Maps API Key (for testing - move to .env in production)
const GOOGLE_MAPS_API_KEY = 'AIzaSyAH5EZt8YgjuC_3JW292pKQciyZH_1KUVQ';

// Coordinate validation middleware (defined directly in this file)
const validateCoordinates = (req, res, next) => {
  const { coordinates } = req.body;
  
  if (!coordinates || 
      typeof coordinates.latitude !== 'number' || 
      typeof coordinates.longitude !== 'number' ||
      coordinates.latitude < -90 || 
      coordinates.latitude > 90 ||
      coordinates.longitude < -180 || 
      coordinates.longitude > 180) {
    return res.status(400).json({ 
      error: 'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180' 
    });
  }
  
  next();
};

// Helper function to get address from coordinates
async function getAddressFromCoordinates(lat, lng) {
  try {
    if (!lat || !lng) throw new Error('Invalid coordinates');
    
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
      { timeout: 5000 }
    );
    
    if (!response.data.results?.length) {
      throw new Error('No address found for these coordinates');
    }
    
    return response.data.results[0].formatted_address;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return 'Address unavailable';
  }
}

// Get all saved locations for user
router.get('/', async (req, res) => {
  try {
    const locations = await SavedLocation.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
      
    res.json(locations);
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Add new location with validation
router.post('/', validateCoordinates, async (req, res) => {
  try {
    const { name, coordinates, type = 'other' } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    const address = await getAddressFromCoordinates(
      coordinates.latitude,
      coordinates.longitude
    );

    const location = await SavedLocation.create({
      userId: req.user.id,
      name: name.trim(),
      address,
      coordinates,
      type
    });

    res.status(201).json(location);
  } catch (error) {
    console.error('Failed to save location:', error);
    res.status(400).json({ error: error.message || 'Failed to save location' });
  }
});

// Update location
router.put('/:id', validateCoordinates, async (req, res) => {
  try {
    const updates = { ...req.body };
    
    if (updates.name && (typeof updates.name !== 'string' || updates.name.trim().length < 2)) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    if (updates.coordinates) {
      updates.address = await getAddressFromCoordinates(
        updates.coordinates.latitude,
        updates.coordinates.longitude
      );
    }

    const location = await SavedLocation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    console.error('Failed to update location:', error);
    res.status(400).json({ error: error.message || 'Failed to update location' });
  }
});

// Delete location
router.delete('/:id', async (req, res) => {
  try {
    const location = await SavedLocation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Failed to delete location:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

// Search places
router.get('/search/places', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`,
      { timeout: 5000 }
    );

    res.json(response.data.predictions);
  } catch (error) {
    console.error('Place search failed:', error);
    res.status(500).json({ error: 'Place search failed' });
  }
});

// Get place details
router.get('/place/details', async (req, res) => {
  try {
    const { placeId } = req.query;
    if (!placeId || typeof placeId !== 'string') {
      return res.status(400).json({ error: 'Place ID is required' });
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`,
      { timeout: 5000 }
    );

    res.json(response.data.result);
  } catch (error) {
    console.error('Failed to get place details:', error);
    res.status(500).json({ error: 'Failed to get place details' });
  }
});

module.exports = router;
