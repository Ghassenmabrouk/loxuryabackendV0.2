const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET; // Your JWT secret key

router.post('/logout', (req, res) => {
  console.log('Logout called');

  try {
    // Extract token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify the token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      // Clear the token cookie (if using cookies)
      res.clearCookie('token', {
        httpOnly: true,
        secure: false, // Change to true in production
        sameSite: 'lax',
      });

      // Respond with success
      res.status(200).json({ message: 'Logout successful' });
    });
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router;
