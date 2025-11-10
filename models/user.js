const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  phoneNumber: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'not specified'],
    default: 'not specified'
  },
  password: {
    type: String,
    required: true
  },
  emailConfirmed: {
    type: Boolean,
    default: false
  },
  tempPassword: {
    type: String,
    required: false
  },
  isBanned: { 
    type: Boolean,
    default: false
  },
  photo: {
    type: String,
    required: false
  },
  vipAccess: {
    type: String,
    enum: ['none', 'silver', 'gold', 'diamond'],
    default: 'none'
  },
  vipExpiresAt: {
    type: Date,
    default: null
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function (value) {
        // Ensure no duplicate tags
        return Array.isArray(value) && new Set(value).size === value.length;
      },
      message: 'Tags must be unique.'
    }
  }
});

module.exports = mongoose.model('User', userSchema);
