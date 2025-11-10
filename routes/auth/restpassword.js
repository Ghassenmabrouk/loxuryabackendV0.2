const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.HOSTINGER_USER,
    pass: process.env.HOSTINGER_PASS
  },
  debug: true
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many password reset attempts. Please try again later.',
});

function generateTempPassword() {
  return crypto.randomBytes(8).toString('hex');
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

function sendTempPasswordEmail(email, tempPassword) {
  const mailOptions = {
    from: process.env.HOSTINGER_USER,
    to: email,
    subject: 'Password Reset Request - Loxurya',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Password Reset Request</h1>
        <p>Hello,</p>
        <p>You have requested to reset your password. Here is your temporary password:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong style="font-size: 18px; color: #D4AF37;">${tempPassword}</strong>
        </div>
        <p><strong>Important:</strong> Please use this temporary password to log in and change your password immediately.</p>
        <p>This temporary password will work alongside your regular password until you change it.</p>
        <p>If you did not request this password reset, please ignore this email and contact support.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">This is an automated email from Loxurya. Please do not reply to this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

router.post('/', resetLimiter, async (req, res) => {
  console.log("Reset password called");
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    console.log('Received email for password reset:', email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    const tempPassword = generateTempPassword();
    const hashedTempPassword = await hashPassword(tempPassword);

    user.tempPassword = hashedTempPassword;
    await user.save();

    try {
      await sendTempPasswordEmail(email, tempPassword);
      console.log('Password reset email sent successfully to:', email);
      res.status(200).json({
        message: 'Password reset email sent successfully. Please check your inbox.'
      });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      user.tempPassword = undefined;
      await user.save();
      res.status(500).json({
        message: 'Failed to send password reset email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

module.exports = router;
