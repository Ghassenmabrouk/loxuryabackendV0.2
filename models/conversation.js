const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  supportAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional
  subject: { type: String, required: true },
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  priority: { type: String, enum: ['normal', 'high'], default: 'normal' },
  lastMessage: {
    body: { type: String },
    createdAt: { type: Date },
  },
  unreadCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
