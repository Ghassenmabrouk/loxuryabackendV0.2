const express = require('express');
const router = express.Router();

const User = require('../../models/user');

router.get('/users/tags',async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      return res.status(200).json({ tags: user.tags });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

module.exports = router;
