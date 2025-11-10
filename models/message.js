const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    attachment: {
      url: { type: String },
      type: { type: String },
      name: { type: String },
    },
    readStatus: {
      type: String,
      enum: ['read', 'unread'],
      default: 'unread',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
