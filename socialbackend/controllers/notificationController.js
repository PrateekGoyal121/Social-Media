const Notification = require("../models/Notification");

/**
 * @desc    Get all notifications of logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ receiver: userId })
      .populate("sender", "username profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

/**
 * @desc    Mark single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Only receiver can mark as read
    if (notification.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update notification",
      error: error.message,
    });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { receiver: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

/**
 * 🔔 Internal helper
 * Used when like/comment/follow happens
 */
exports.createNotification = async ({
  sender,
  receiver,
  type,
  post,
}) => {
  try {
    // ✅ Safety checks (PREVENTS toString crash)
    if (!sender || !receiver || !type) {
      console.error("Notification error: missing fields", {
        sender,
        receiver,
        type,
      });
      return null;
    }

    // 🚫 Avoid self-notifications
    if (sender.toString() === receiver.toString()) return null;

    const notification = await Notification.create({
      sender,
      receiver,
      type,
      post,
    });

    // Optional: populate sender for real-time usage
    return await notification.populate("sender", "username profilePic");
  } catch (error) {
    console.error("Notification error:", error.message);
    return null;
  }
};

exports.createNotificationAPI = async (req, res) => {
  try {
    const { receiver, type, post } = req.body;

    await exports.createNotification({
      sender: req.user.id,
      receiver,
      type,
      post,
    });

    res.status(201).json({
      success: true,
      message: "Notification created",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};