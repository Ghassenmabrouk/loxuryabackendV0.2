const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit'); // For rate limiting

const JWT_SECRET = process.env.JWT_SECRET;

// Rate limiting for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts. Please try again later.',
});

router.use(express.json({ limit: '50mb' }));

router.post('/login', loginLimiter, async (req, res) => {
  console.log('Login called');

  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+photo +password +tempPassword');

    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is confirmed
    if (!user.emailConfirmed) {
      console.log('Login failed: Email not confirmed for user:', user.email);
      return res.status(403).json({ message: 'Please confirm your email before logging in.' });
    }

    // Check if user is banned
    if (user.isBanned) {
      console.log('Login failed: Banned user attempted login:', user.email);
      return res.status(405).json({ message: 'You are banned. Please contact support.' });
    }

    // Validate password
    const passwordMatches = await bcrypt.compare(password, user.password);
    const tempPasswordMatches = user.tempPassword && await bcrypt.compare(password, user.tempPassword);

    if (!passwordMatches && !tempPasswordMatches) {
      console.log('Login failed: Invalid credentials for user:', user.email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Clear tempPassword if used
    if (tempPasswordMatches && user.tempPassword) {
      user.tempPassword = undefined;
      await user.save();
    }

    // Create userInfo object
    const userInfo = {
      id: user._id.toString(),
      name: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      photo: user.photo,
      gender: user.gender,
      vip: user.vipAccess,
      vipExpiresAt: user.vipExpiresAt,
    };

    // Generate JWT token
    const token = jwt.sign(userInfo, JWT_SECRET, { expiresIn: '24h' });

    // Set cookie with token
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    console.log('Login successful for user:', user.username);

    // Return token and userInfo in the response
    res.status(200).json({ message: 'Login successful', token, userInfo });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
