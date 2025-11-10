const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const jwt = require('jsonwebtoken');
const JWT_SECRET = '@dn3n||c@r';

router.post('/edit', async (req, res) => {
  try {
   
    const { username, email, phoneNumber} = req.body;
    console.log(username);

  
    const userEmail = req.user.email;
    console.log(userEmail);
  
    const user = await User.findOne({ email: userEmail });
    
   
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    if (username) {
      user.username = username;
      console.log(user.username);
    }
    if (email) {
      user.email = email;
    }
    if (phoneNumber) {
      user.phoneNumber = phoneNumber;
    }
    
    await user.save();

    const updatedUserInfo = {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
    const newToken = jwt.sign(updatedUserInfo, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ message: 'User information updated successfully.', token: newToken });
  } catch (error) {
    console.error('Error updating user information:', error);
    res.status(500).json({ message: 'An error occurred while updating user information.' });
  }
});






// Fetch the current user's VIP access
router.get('/vip-level', async (req, res) => {
  try {
    const userId = req.user.id; // Assuming middleware sets `req.user`
    
    const user = await User.findById(userId, 'vipAccess vipExpiresAt'); // Fetch VIP-related fields only

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      vipAccess: user.vipAccess || 'none',
      vipExpiresAt: user.vipExpiresAt,
    });
  } catch (error) {
    console.error('Error fetching VIP access:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





module.exports = router;



