const express = require('express');
const router = express.Router();
const User = require('../../models/user');
require('dotenv').config();

router.get('/confirm/:email', async (req, res) => {
    const email = req.params.email;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send('User not found.');
        }

        user.emailConfirmed = true;
        await user.save();

        const baseUrl = process.env.BASE_URL || 'http://localhost:4200';

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Confirmed</title>
                <style>
                    body {
                        padding: 20px;
                        font-family: Arial, sans-serif;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Email Successfully Confirmed</h1>
                    <p>Thank you for confirming your email. You can now login and enjoy full access to our services.</p>
                    
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Confirmation error:', error);
        res.status(500).send('Error confirming email.');
    }
});

module.exports = router;
