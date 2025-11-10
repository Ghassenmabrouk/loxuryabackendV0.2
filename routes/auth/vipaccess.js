const express = require('express');
const User = require('../../models/user'); // Assuming your User model is in this path
const router = express.Router();

// Get the user's VIP level and expiration date based on email in the JWT payload
router.get('/vip', async (req, res) => {
  try {
    const userEmail = req.user.email; // Extract email from JWT payload
    const user = await User.findOne({ email: userEmail }, 'vipAccess vipExpiresAt'); // Fetch only required fields

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      vipAccess: user.vipAccess,
      vipExpiresAt: user.vipExpiresAt,
    });
  } catch (error) {
    console.error('Error fetching user VIP data:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
