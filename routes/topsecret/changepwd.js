const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const bcrypt = require('bcryptjs');
const AttemptTracker = require('../../models/attemptTracker');
const JWT_SECRET = '@dn3n||c@r';  // Adjust as needed for your JWT secret

// Endpoint to request password verification (tracks attempts but does not expose passwords)
router.post('/getpassword', async (req, res) => {
  try {
    const email = req.user.email;  // Assuming email is available through JWT or session
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if the user has exceeded 3 attempts today
    let tracker = await AttemptTracker.findOne({ email });
    const currentDate = new Date().toISOString().split('T')[0];  // Get current date

    if (tracker && tracker.date === currentDate && tracker.attempts >= 3) {
      return res.status(403).json({ message: 'You have exceeded the maximum number of attempts for today. Please try again tomorrow.' });
    }

    // Increment the attempt count or initialize it
    if (tracker) {
      tracker.attempts=0;
    } else {
      tracker = new AttemptTracker({ email, date: currentDate, attempts: 1 });
    }

    // Save the attempt tracker
    await tracker.save();

    // Send a success message (don't expose sensitive data like passwords)
    res.status(200).json({
      message: 'Password verification requested successfully.',
      note: 'Please verify your password when updating your profile.'
    });
  } catch (error) {
    console.error('Error fetching password info:', error);
    res.status(500).json({ message: 'An error occurred while fetching the password.' });
  }
});

// Endpoint for the user to verify the current password (to update profile)
router.post('/verify-password', async (req, res) => {
    console.log('Verifying password');
    try {
      const { password } = req.body;  // The user provides the current password to verify
      const email = req.user.email;   // Assuming email is available in the request (e.g., from JWT or session)
      
      // Fetch the user from the database using the email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Log the password being sent and the hashed password in the database for debugging
      console.log('Plain-text password:', password);
      console.log('Stored hashed password:', user.password);
  
      // Compare the provided password (plain-text) with the hashed password (from the database)
      const isMatch = await bcrypt.compare(password, user.password);
      
      // Log the result of the comparison (true if the passwords match, false if not)
      console.log('Password match result:', isMatch);
  
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect password.' });
      }
  
      // If the password matches, allow them to continue
      res.status(200).json({
        message: 'Password verified successfully.',
      });
    } catch (error) {
      console.error('Error verifying password:', error);
      res.status(500).json({ message: 'An error occurred while verifying the password.' });
    }
  });
  

module.exports = router;
