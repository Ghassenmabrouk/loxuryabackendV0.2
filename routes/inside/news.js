const express = require('express');
const News = require('../../models/news');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const upload = require('../../config/multer'); // Import multer configuration









// Create a new news item
// Handle image uploads and form data
router.post('/news', upload.array('images', 10), async (req, res) => {
  const { title, description, vipRequirement, startDate, endDate } = req.body; // Extract startDate and endDate directly
  const files = req.files;

  try {
    // Process uploaded images
    const images = files.map(file => `/uploads/news/${file.filename}`);

    // Convert startDate and endDate from the request body into valid Date objects
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    // Validate the parsed dates
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const currentDate = new Date();
    let status = 'Coming Soon';

    if (currentDate >= parsedStartDate && currentDate <= parsedEndDate) {
      status = 'Live';
    } else if (currentDate > parsedEndDate) {
      status = 'Expired';
    }

    const newNews = new News({
      title,
      description,
      duration: {
        start: parsedStartDate,
        end: parsedEndDate,
      },
      vipRequirement,
      status,
      images, // Include the uploaded image paths
    });

    const savedNews = await newNews.save();
    res.status(201).json({ message: 'News created successfully', news: savedNews });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ message: 'Error creating news', error });
  }
});


// Get all news
router.get('/news', async (req, res) => {
  try {
    // Filter news by status (only 'Coming Soon' or 'Live Now')
    const news = await News.find({
      status: { $in: ['Coming Soon', 'Live'] },
    });

    res.status(200).json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ message: 'Error fetching news', error });
  }
});

// Delete an image file
const deleteImage = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Failed to delete image at ${filePath}:`, err);
    }
  });
};

// Example: Delete all images associated with a news item
router.delete('/news/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (news.images) {
      news.images.forEach(deleteImage);
    }
    await News.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'News deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting news', error });
  }
});

module.exports = router;
