const Notification = require('../models/Notification');

// Emit helper function assuming io is on req
const emitNotification = (req, userId, notification) => {
  if (req.io) {
    req.io.to(`user_${userId}`).emit('new_notification', notification);
  }
};

exports.createNotification = async (req, userId, fromUserId, type, message, link) => {
  if (userId.toString() === fromUserId.toString() && type !== 'system' && type !== 'trade') return;
  const notif = await Notification.create({ user: userId, fromUser: fromUserId, type, message, link });
  
  // Populate fromUser for immediate emit
  const populated = await notif.populate('fromUser', 'name avatar');
  emitNotification(req, userId, populated);
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('fromUser', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark as read.' });
  }
};
