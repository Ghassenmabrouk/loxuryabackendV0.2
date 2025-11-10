const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  performedBy: { type: String, required: true }
});

const History = mongoose.model('History', historySchema);

module.exports = History;
