const express = require('express');
const router = express.Router();
const Driver = require('../../models/driver');
const Form = require('../../models/form');

router.get('/current', async (req, res) => {
    try {
      const driverId = req.user.id;
      const driver = await Driver.findOne({ user: driverId });
  
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found.' });
      }
  
      res.status(200).json(driver);
    } catch (error) {
      console.error('Error fetching driver details:', error);
      res.status(500).json({ message: 'An error occurred while fetching the driver details.' });
    }
});

router.post('/create', async (req, res) => {
    try {
      const { user, name, idCard, phone, email, vehicle, location, availability, rating } = req.body;
  
      if (!user || !idCard || !phone) {
        return res.status(400).json({ message: 'User ID, ID Card, and Phone are required.' });
      }
  
      const existingDriver = await Driver.findOne({ $or: [{ email }, { idCard }] });
      if (existingDriver) {
        return res.status(400).json({ message: 'Driver with this email or ID card already exists.' });
      }
  
      const driver = new Driver({
        user,
        name,
        idCard,
        phone,
        email,
        vehicle,
        location,
        availability,
        rating
      });
  
      const savedDriver = await driver.save();
      res.status(201).json({ message: 'Driver created successfully.', driver: savedDriver });
    } catch (error) {
      console.error('Error creating driver:', error);
      res.status(500).json({ message: 'An error occurred while creating the driver.' });
    }
});
  
router.get('/', async (req, res) => {
    try {
        const drivers = await Driver.find();
        res.status(200).json(drivers);
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ message: 'An error occurred while fetching drivers.' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }
        res.status(200).json(driver);
    } catch (error) {
        console.error('Error fetching driver:', error);
        res.status(500).json({ message: 'An error occurred while fetching the driver.' });
    }
});

router.put('/update/:id', async (req, res) => {
    try {
        const { name, phone, email, vehicle, location, availability } = req.body;

        const updatedDriver = await Driver.findByIdAndUpdate(
            req.params.id,
            { name, phone, email, vehicle, location, availability, updatedAt: Date.now() },
            { new: true }
        );

        if (!updatedDriver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }

        res.status(200).json({ message: 'Driver updated successfully.', driver: updatedDriver });
    } catch (error) {
        console.error('Error updating driver:', error);
        res.status(500).json({ message: 'An error occurred while updating the driver.' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedDriver = await Driver.findByIdAndDelete(req.params.id);
        if (!deletedDriver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }
        res.status(200).json({ message: 'Driver deleted successfully.' });
    } catch (error) {
        console.error('Error deleting driver:', error);
        res.status(500).json({ message: 'An error occurred while deleting the driver.' });
    }
});

router.get('/rides/pending', async (req, res) => {
    try {
        const pendingRides = await Form.find({ status: 'pending' });
        res.status(200).json(pendingRides);
    } catch (error) {
        console.error('Error fetching pending rides:', error);
        res.status(500).json({ message: 'An error occurred while fetching pending rides.' });
    }
});

router.put('/rides/accept/:rideId', async (req, res) => {
    try {
        const rideId = req.params.rideId;
        const driverId = req.user.id;

        const driver = await Driver.findOne({ user: driverId });
        if (!driver || !driver.idCard) {
            return res.status(404).json({ message: 'Driver not found or ID card missing.' });
        }

        const driverDetails = {
            idCard: driver.idCard,
            name: driver.name,
            car: driver.vehicle || {},
        };

        const updatedRide = await Form.findByIdAndUpdate(
            rideId,
            {
                status: 'confirmed',
                driverDetails: driverDetails,
                updatedAt: Date.now(),
            },
            { new: true }
        );

        if (!updatedRide) {
            return res.status(404).json({ message: 'Ride not found.' });
        }

        res.status(200).json({ message: 'Ride accepted successfully.', ride: updatedRide });
    } catch (error) {
        console.error('Error accepting ride:', error);
        res.status(500).json({ message: 'An error occurred while accepting the ride.' });
    }
});

module.exports = router;
