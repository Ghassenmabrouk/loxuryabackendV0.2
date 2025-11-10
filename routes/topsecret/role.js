
const express = require('express');
const router = express.Router();

const User = require('../../models/user');





router.get('/users/role', (req, res) => {
    return res.json({ role: req.user.role }); 
  });

router.post('/users/add-tag',  async (req, res) => {
  const { tag } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.tags.includes(tag)) {
      user.tags.push(tag);
      await user.save();
      return res.status(200).json({ message: 'Tag added successfully', tags: user.tags });
    } else {
      return res.status(400).json({ message: 'Tag already exists' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Remove a Tag from User
router.post('/users/remove-tag',  async (req, res) => {
  const { tag } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.tags.includes(tag)) {
      user.tags = user.tags.filter((t) => t !== tag);
      await user.save();
      return res.status(200).json({ message: 'Tag removed successfully', tags: user.tags });
    } else {
      return res.status(400).json({ message: 'Tag not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

















  

  module.exports = router;