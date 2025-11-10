const mongoose = require('mongoose');

const careerApplicationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: /.+\@.+\..+/,
  },
  phone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/,
  },
  position: {
    type: String,
    required: true,
  },
  experience: {
    type: String,
    required: true,
  },
  education: {
    type: String,
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  },
  coverLetter: {
    type: String,
    required: true,
  },
  resumePath: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CareerApplication', careerApplicationSchema);