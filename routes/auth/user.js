const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

// Set up the email transporter with Hostinger SMTP settings
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.HOSTINGER_USER,
    pass: process.env.HOSTINGER_PASS
  },
  debug: true // Enable debug output
});


// Function to send the confirmation email
const sendConfirmationEmail = (userEmail) => {
  const confirmationUrl = `https://ubc-back.onrender.com/confirm/confirm/${userEmail}`;

  const mailOptions = {
    from: process.env.HOSTINGER_USER,
    to: userEmail,
    subject: 'Please confirm your account',
    html: `<h1>Email Confirmation</h1>
           <p>Thank you for registering. Please confirm your email by clicking on the following link:</p>
           <a href="${confirmationUrl}">Confirm Email</a>`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending confirmation email:', error);
    } else {
      console.log('Confirmation email sent:', info.response);
    }
  });
};

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }
});

router.post('/', upload.single('photo'), async (req, res) => {
  console.log('REGISTER CALLED');
  const { firstName, lastName, username, email, gender, phoneNumber, password, role } = req.body;
  console.log("Registering user:", req.body);
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      gender,
      phoneNumber,
      role,
      password: hashedPassword,
      photo: req.file ? req.file.path : null
    });

    await newUser.save();

    // Send the confirmation email
    sendConfirmationEmail(email);

    res.status(200).json({
      message: 'Registration successful. Please check your email to confirm your account.',
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username,
        email: newUser.email,
        gender: newUser.gender,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

module.exports = router;
