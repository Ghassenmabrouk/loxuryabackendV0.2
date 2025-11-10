const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../../app');  // Destructure to get the verifyToken middleware
const JWT_SECRET = '@dn3n||c@r';

// The route for editing user information
router.post('/fulledit', async (req, res) => {
  try {
    console.log('fulledit');
    console.log(req.user);  // Log the entire `req.user` to verify it's available
    console.log(req.user.email);  // Access `req.user.email` properly

    // Extract the fields from the request body
    const { firstName, lastName, username, email, phoneNumber, gender, photo } = req.body;
    const userEmail = req.user.email;  // Get the email from the decoded JWT
    console.log('Email from JWT:', userEmail);

    // Find the user by their email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update the user's fields only if they are provided in the request body
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (username) user.username = username;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (gender) user.gender = gender;
    if (photo) user.photo = photo;

    // Save the updated user information
    await user.save();

    // Prepare the updated user information (without password)
    const updatedUserInfo = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      photo: user.photo,
      role: user.role,
    };

    // Generate a new JWT with the updated user information
    const newToken = jwt.sign(updatedUserInfo, JWT_SECRET, { expiresIn: '24h' });

    // Set the new token in the response cookie
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',  // Ensure secure cookie only in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,  // 24 hours expiration
    });

    // Send the response with a success message and the new token
    res.status(200).json({ message: 'User information updated successfully.', token: newToken });
  } catch (error) {
    console.error('Error updating user information:', error);
    res.status(500).json({ message: 'An error occurred while updating user information.' });
  }
});

module.exports = router;
