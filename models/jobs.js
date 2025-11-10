const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract'],
    required: true,
    set: (value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(), // Normalize input
  },
  
  description: {
    type: String,
    required: true,
  },
  requirements: {
    type: [String], // Array of strings
    default: [],
  },
  responsibilities: {
    type: [String], // Array of strings
    default: [],
  },
  benefits: {
    type: [String], // Array of strings
    default: [],
  },
  salary: {
    min: { type: Number, required: false }, //
    max: { type: Number, required: false }, //
    currency: { type: String, default: 'USD' },
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'closed'],
    default: 'draft',
  },
  datePosted: {
    type: Date,
    default: Date.now,
  },
  icon: {
    type: String,
    default: '💼',
  },
  postedBy: {
    type: String, // Store user's email instead of ObjectId
    required: true,
  },
});

module.exports = mongoose.model('Job', jobSchema);
