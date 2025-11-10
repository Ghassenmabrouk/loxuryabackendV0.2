const express = require('express');
const router = express.Router();
const User = require('../../models/user');

// Get user info including new fields
router.get('/updateduser', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      photo: user.photo,
      role: user.role,
      activeBookings: user.activeBookings,
      loyaltyPoints: user.loyaltyPoints,
      averageRating: user.averageRating,
      achievements: user.achievements
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Update user fields
router.put('/updateduser', async (req, res) => {
  try {
    const updateFields = {};
    const allowedFields = ['activeBookings', 'loyaltyPoints', 'averageRating', 'achievements'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });
    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      { $set: updateFields },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({
      message: 'User updated successfully.',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        photo: user.photo,
        role: user.role,
        activeBookings: user.activeBookings,
        loyaltyPoints: user.loyaltyPoints,
        averageRating: user.averageRating,
        achievements: user.achievements
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
