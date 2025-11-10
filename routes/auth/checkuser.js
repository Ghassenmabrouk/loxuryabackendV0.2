const express = require('express');
const router = express.Router();
const User = require('../../models/user');


router.get('/checkuser/:email', async (req, res) => {
    const email = req.params.email;
    try {
        const user = await User.findOne({ email: email });
        if (user) {
           
            res.json({ exists: true, email: email });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error checking receiver existence:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
