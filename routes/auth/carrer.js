const express = require('express');
const CareerApplication = require('../../models/carrier'); // Adjust path as needed
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Job = require('../../models/jobs');

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes'); // Adjust upload path
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Create a new career application

router.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      position,
      experience,
      education,
      skills,
      coverLetter,
    } = req.body;

    const resumePath = req.file ? req.file.path : undefined;

    // Check if file exists
    if (resumePath && !fs.existsSync(resumePath)) {
      throw new Error('Uploaded file does not exist');
    }

    const application = new CareerApplication({
      fullName,
      email,
      phone,
      position,
      experience,
      education,
      skills: JSON.parse(skills),
      coverLetter,
      resumePath,
    });

    const savedApplication = await application.save();
    res.status(201).json({ message: 'Application submitted successfully', application: savedApplication });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all applications
router.get('/applications', async (req, res) => {
  try {
    const applications = await CareerApplication.find();
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/jobs', async (req, res) => {
    try {
      const jobs = await Job.find(); // No need for `.populate` since `postedBy` is now a string
      res.status(200).json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ message: 'Error fetching jobs', error });
    }
  });

module.exports = router;
