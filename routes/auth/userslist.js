const express = require('express');
const router = express.Router();
const User = require('../../models/user'); // Assuming the User model is in the models directory
const bcrypt = require('bcrypt'); // Assuming you need bcrypt for password hashing

console.log('userlist call');

// Get all users
router.get('/allusers', async (req, res) => {
  console.log('allusers called');
  try {
    const users = await User.find();
    console.log(users);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single user by email
router.get('/users/:email', getUser, (req, res) => {
  console.log('get one user called');
  res.json(res.user);
});

// Middleware to fetch user
async function getUser(req, res, next) {
  let user;
  try {
    user = await User.findOne({ email: req.params.email });

    if (user == null) {
      return res.status(404).json({ message: 'Cannot find user' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.user = user;
  next();
}

// Ban a user
router.post('/ban/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('banning user', email);
    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { isBanned: true },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ ok: false, message: 'User not found.' });
    }

    res.status(200).json({ ok: true, message: 'User banned successfully.' });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Unban a user
router.post('/unban/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('unbanning user', email);
    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { isBanned: false },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ ok: false, message: 'User not found.' });
    }

    res.status(200).json({ ok: true, message: 'User unbanned successfully.' });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Delete a user
router.delete('/deleteuser/:email', async (req, res) => {
  const { email } = req.params;
  console.log(email);
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Edit a user
router.put('/edituser/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    const { password, firstName, lastName, phoneNumber, role, emailConfirmed } = req.body;

    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update user fields if provided
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (role !== undefined) user.role = role;
    if (emailConfirmed !== undefined) user.emailConfirmed = emailConfirmed;

    // Hash new password if it was provided
    if (password !== undefined) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.status(200).json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Error updating user information:', error);
    res.status(500).json({ message: 'An error occurred while updating the user information.' });
  }
});

// Get user details with photo conversion
router.get('/user/user/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Convert photo buffer to base64 string
    const photoBase64 = user.photo ? user.photo.toString('base64') : null;
    res.json({ ...user.toObject(), photo: photoBase64 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
