const express = require('express');
const Job = require('../../models/jobs');
const router = express.Router();

// Create a new job posting
router.post('/', async (req, res) => {
    const {
      title,
      department,
      location,
      type,
      description,
      requirements,
      responsibilities,
      benefits,
      salary,
      status,
      icon,
    } = req.body;
    const email = req.user?.email;
    if (!email) {
      return res.status(400).json({ message: 'User email is required to create a job.' });
    }
    try {
      const newJob = new Job({
        title,
        department,
        location,
        type,
        description,
        requirements,
        responsibilities,
        benefits,
        salary,
        status,
        icon,
        postedBy: email, // Ensure the authenticated user's ID is included
      });
  
      const savedJob = await newJob.save();
      res.status(201).json({ message: 'Job created successfully', job: savedJob });
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({ message: 'Error creating job', error });
    }
  });
  

// Get all jobs (with user info)
router.get('/', async (req, res) => {
    try {
      const jobs = await Job.find(); // No need for `.populate` since `postedBy` is now a string
      res.status(200).json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ message: 'Error fetching jobs', error });
    }
  });
  

// Get a single job by ID (with user info)
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'firstName lastName email');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Error fetching job', error });
  }
});

// Update a job
router.put('/:id', async (req, res) => {
  const {
    title,
    department,
    location,
    type,
    description,
    requirements,
    responsibilities,
    benefits,
    salary,
    status,
    icon,
  } = req.body;

  try {
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      {
        title,
        department,
        location,
        type,
        description,
        requirements,
        responsibilities,
        benefits,
        salary,
        status,
        icon,
      },
      { new: true }
    );

    if (!updatedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json({ message: 'Job updated successfully', job: updatedJob });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Error updating job', error });
  }
});

// Delete a job
router.delete('/:id', async (req, res) => {
  try {
    const deletedJob = await Job.findByIdAndDelete(req.params.id);

    if (!deletedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Error deleting job', error });
  }
});

module.exports = router;
