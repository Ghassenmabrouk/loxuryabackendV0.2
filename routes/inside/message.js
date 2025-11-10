const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Conversation = require('../../models/conversation');
const Message = require('../../models/message');

// Helper function to validate and convert to ObjectId
function toObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null;
}

// Fetch conversations
router.get('/conversations', async (req, res) => {
  const { status, priority, unread } = req.query;

  let filters = {};
  if (status) filters.status = status;
  if (priority) filters.priority = priority;
  if (unread === 'true') filters.unreadCount = { $gt: 0 };

  try {
    const conversations = await Conversation.find(filters).sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch messages for a conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new conversation
router.post('/conversations', async (req, res) => {
  const { subject, priority, status } = req.body;

  try {
    const newConversation = new Conversation({
      userId: req.user.id, // Assuming `req.user.id` is set by middleware
      subject,
      priority,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
      unreadCount: 0,
    });

    const savedConversation = await newConversation.save();
    res.status(201).json({
      ...savedConversation.toObject(),
      id: savedConversation._id, // Add `id` for frontend compatibility
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/conversations/:id/messages', async (req, res) => {
    const { body, attachment } = req.body;
    const senderId = req.user.id; // Corrected here
  
    console.log(senderId, attachment, body);
  
    // Validate input
    if (!body || !senderId || !mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ error: 'Invalid data provided' });
    }
  
    try {
      const newMessage = new Message({
        conversationId: req.params.id,
        senderId, // Use the corrected senderId
        body,
        attachment,
      });
  
      const savedMessage = await newMessage.save();
  
      // Update the conversation
      await Conversation.findByIdAndUpdate(req.params.id, {
        lastMessage: { body, createdAt: new Date() },
        $inc: { unreadCount: 1 },
      });
  
      res.status(201).json(savedMessage);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  

// Mark a conversation as resolved
router.patch('/conversations/:id/resolve', async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(req.params.id, { status: 'resolved' }, { new: true });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
router.patch('/messages/mark-read', async (req, res) => {
  const { messageIds } = req.body;

  try {
    await Message.updateMany({ _id: { $in: messageIds } }, { readStatus: 'read' });
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
