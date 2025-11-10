const express = require('express');
const router = express.Router();
const axios = require('axios');
const Driver = require('../../models/driver');
const Form = require('../../models/form');

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAH5EZt8YgjuC_3JW292pKQciyZH_1KUVQ';

// Route Calculation Endpoint
router.get('/api/route', async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end coordinates are required.' });
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${start}&destination=${end}&key=${GOOGLE_MAPS_API_KEY}`
    );

    const route = response.data.routes[0].overview_polyline.points;
    const distance = response.data.routes[0].legs[0].distance.text;
    const duration = response.data.routes[0].legs[0].duration.text;

    res.json({ route, distance, duration });
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({ error: 'Failed to calculate the route. Please try again.' });
  }
});

// Suggestions Endpoint
router.get('/api/suggestions', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required.' });
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`
    );

    const suggestions = response.data.predictions.map((prediction) => ({
      id: prediction.place_id,
      name: prediction.description,
    }));

    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions. Please try again.' });
  }
});

// Place Details Endpoint
router.get('/api/place-details', async (req, res) => {
  const { place_id } = req.query;

  if (!place_id) {
    return res.status(400).json({ error: 'Place ID is required.' });
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${GOOGLE_MAPS_API_KEY}`
    );

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching place details:', error);
    res.status(500).json({ error: 'Failed to fetch place details. Please try again.' });
  }
});

// Helper function to get location name from coordinates
async function getLocationNameFromGoogle(coordinates) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.latitude},${coordinates.longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );

    const locationName = response.data.results[0]?.formatted_address || 'Unknown Location';
    return locationName;
  } catch (error) {
    console.error('Error fetching location name from Google:', error.message);
    return 'Unknown Location';
  }
}

// Update driver location
router.put('/update-location', async (req, res) => {
  try {
    const { driverId, location } = req.body;

    if (!driverId || !location) {
      return res.status(400).json({ message: 'Driver ID and location are required.' });
    }

    const updatedDriver = await Driver.findByIdAndUpdate(
      driverId,
      {
        'location.latitude': location.latitude,
        'location.longitude': location.longitude,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    res.status(200).json({ message: 'Driver location updated.', driver: updatedDriver });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ message: 'An error occurred while updating the location.' });
  }
});

// Create a new ride
router.post('/create', async (req, res) => {
  try {
    const {
      name,
      pickupDate,
      pickupTime,
      pickupLocation,
      destinations,
      passengers,
      contact,
      specialRequests,
      carMake,
    } = req.body;

    // Validate input
    if (!pickupLocation || !pickupLocation.coordinates) {
      return res.status(400).json({ message: 'Pickup location and coordinates are required.' });
    }

    if (!Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({ message: 'Destinations must be a non-empty array.' });
    }

    const [pickupLatitude, pickupLongitude] = pickupLocation.coordinates.split(',').map(Number);
    let pickupLocationName = 'Unknown Location';
    
    try {
      pickupLocationName = await getLocationNameFromGoogle({
        latitude: pickupLatitude,
        longitude: pickupLongitude,
      });
    } catch (error) {
      console.error('Error fetching pickup location name:', error.message);
    }

    const destinationDetails = await Promise.all(
      destinations.map(async (destination) => {
        const [destLatitude, destLongitude] = destination.location.split(',').map(Number);
        let destinationName = destination.destinationName || 'Unknown Location';
        try {
          destinationName = await getLocationNameFromGoogle({
            latitude: destLatitude,
            longitude: destLongitude,
          });
        } catch (error) {
          console.error(`Error fetching destination name for ${destination.location}:`, error.message);
        }

        return {
          location: destination.location,
          destinationName,
          stoppingTime: destination.stoppingTime || null,
        };
      })
    );

    const form = new Form({
      name: req.user?.name || name,
      userId: req.user?.id,
      pickupDate,
      pickupTime,
      pickupLocation: {
        coordinates: pickupLocation.coordinates,
        locationName: pickupLocationName,
      },
      destinations: destinationDetails,
      passengers,
      contact,
      specialRequests,
      carMake: carMake || 'Any',
      status: 'pending',
    });

    const savedForm = await form.save();
    res.status(201).json({ message: 'Ride created successfully.', form: savedForm });
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(500).json({ message: 'An error occurred while creating the ride.', error: error.message });
  }
});

// Favorite ride endpoints
router.put('/favorite/:id', async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = req.user.id;

    const ride = await Form.findOne({ _id: rideId, userId });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found.' });
    }

    ride.favorite = !ride.favorite;
    await ride.save();

    res.status(200).json({ message: 'Ride favorite status updated.', favorite: ride.favorite });
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    res.status(500).json({ message: 'An error occurred while updating the favorite status.' });
  }
});

router.put('/remove-favorite/:id', async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = req.user.id;

    const ride = await Form.findOne({ _id: rideId, userId });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found.' });
    }

    ride.favorite = false;
    await ride.save();

    res.status(200).json({ message: 'Ride removed from favorites.', favorite: ride.favorite });
  } catch (error) {
    console.error('Error removing favorite status:', error);
    res.status(500).json({ message: 'An error occurred while removing the favorite status.' });
  }
});

router.get('/favorites', async (req, res) => {
  try {
    const userId = req.user.id;
    const favoriteRides = await Form.find({ userId, favorite: true });
    res.status(200).json(favoriteRides);
  } catch (error) {
    console.error('Error fetching favorite rides:', error);
    res.status(500).json({ message: 'An error occurred while fetching favorite rides.' });
  }
});

// Get user's rides
router.get('/myrides', async (req, res) => {
  try {
    const rides = await Form.find({ userId: req.user.id });
    res.status(200).json(rides);
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ message: 'An error occurred while fetching rides.' });
  }
});

// Get specific ride
router.get('/:id', async (req, res) => {
  try {
    const ride = await Form.findOne({ _id: req.params.id });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found.' });
    }

    const { coordinates, locationName } = ride.pickupLocation || {};
    if (!coordinates) {
      return res.status(400).json({ message: 'Invalid pickup location.' });
    }

    const [pickupLat, pickupLng] = coordinates.split(',').map((part) => parseFloat(part.trim()));
    if (isNaN(pickupLat) || isNaN(pickupLng)) {
      return res.status(400).json({ message: 'Invalid pickup coordinates.' });
    }

    const destinations = (ride.destinations || []).map((destination) => {
      if (!destination.location) return null;
      const [destLat, destLng] = destination.location.split(',').map((part) => parseFloat(part.trim()));
      if (isNaN(destLat) || isNaN(destLng)) return null;

      return {
        latitude: destLat,
        longitude: destLng,
        locationName: destination.destinationName || 'Unknown',
      };
    }).filter(Boolean);

    res.status(200).json({
      _id: ride._id,
      pickupLocation: {
        latitude: pickupLat,
        longitude: pickupLng,
        locationName,
      },
      destinations,
      pickupDate: ride.pickupDate,
      pickupTime: ride.pickupTime,
      status: ride.status,
      driverDetails: ride.driverDetails,
    });
  } catch (error) {
    console.error('Error fetching ride:', error);
    res.status(500).json({ message: 'An error occurred while fetching the ride.' });
  }
});

// Update ride
router.put('/update/:id', async (req, res) => {
  try {
    const updatedRide = await Form.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );

    if (!updatedRide) {
      return res.status(404).json({ message: 'Ride not found or unauthorized.' });
    }

    res.status(200).json({ message: 'Ride updated successfully.', ride: updatedRide });
  } catch (error) {
    console.error('Error updating ride:', error);
    res.status(500).json({ message: 'An error occurred while updating the ride.' });
  }
});

// Delete ride
router.delete('/:rideId', async (req, res) => {
  try {
    const ride = await Form.findById(req.params.rideId);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this ride' });
    }

    await Form.findByIdAndDelete(req.params.rideId);
    res.status(200).json({ message: 'Ride deleted successfully' });
  } catch (error) {
    console.error('Error deleting ride:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel ride
router.put('/cancel/:rideId', async (req, res) => {
  try {
    const ride = await Form.findById(req.params.rideId);

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.userId.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this ride' });
    }

    ride.status = 'cancelled';
    await ride.save();
    res.status(200).json({ message: 'Ride cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling ride:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get accepted rides for driver
router.get('/rides/accepted', async (req, res) => {
  try {
    const driverId = req.query.id || req.user.id;

    if (!driverId) {
      return res.status(400).json({ message: 'Driver ID is required.' });
    }

    const driver = await Driver.findOne({ user: driverId });
    if (!driver || !driver.idCard) {
      return res.status(404).json({ message: 'Driver not found or ID card missing.' });
    }

    const acceptedRides = await Form.find({
      'driverDetails.idCard': driver.idCard,
      status: 'confirmed',
    });

    const sanitizedRides = acceptedRides.map((ride) => {
      const [pickupLat, pickupLng] = ride.pickupLocation.coordinates
        .split(',')
        .map((val) => parseFloat(val.trim()));

      const sanitizedDestinations = ride.destinations.map((destination) => {
        const [destLat, destLng] = destination.location
          .split(',')
          .map((val) => parseFloat(val.trim()));

        return {
          ...destination,
          latitude: !isNaN(destLat) ? destLat : null,
          longitude: !isNaN(destLng) ? destLng : null,
        };
      });

      return {
        ...ride._doc,
        pickupLocation: {
          ...ride.pickupLocation,
          latitude: !isNaN(pickupLat) ? pickupLat : null,
          longitude: !isNaN(pickupLng) ? pickupLng : null,
        },
        destinations: sanitizedDestinations.filter(
          (dest) => dest.latitude !== null && dest.longitude !== null
        ),
      };
    });

    res.status(200).json(sanitizedRides);
  } catch (error) {
    console.error('Error fetching accepted rides:', error);
    res.status(500).json({ message: 'An error occurred while fetching accepted rides.' });
  }
});

module.exports = router;
