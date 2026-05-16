const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Recipient
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Sender
    type: { type: String, enum: ['like', 'comment', 'trade', 'system'], required: true },
    message: { type: String, required: true },
    link: { type: String }, // e.g., '/post/123'
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
