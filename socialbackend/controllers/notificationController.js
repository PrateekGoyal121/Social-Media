const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ receiver: req.user.id })
      .populate("sender", "username profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification)
      return res.status(404).json({ message: "Notification not found" });
    if (notification.receiver.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { receiver: req.user.id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification)
      return res.status(404).json({ message: "Notification not found" });
    if (notification.receiver.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    await notification.deleteOne();
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE NOTIFICATION (internal helper called by other controllers) ─────────
exports.createNotification = async ({ sender, receiver, type, post }) => {
  try {
    if (!sender || !receiver || !type) return null;

    // Never notify yourself
    if (sender.toString() === receiver.toString()) return null;

    const notification = await Notification.create({ sender, receiver, type, post });

    const populated = await Notification.findById(notification._id)
      .populate("sender", "username profilePic")
      .lean();

    // Stringify IDs for consistency on the frontend
    populated._id      = populated._id.toString();
    populated.sender   = {
      ...populated.sender,
      _id: populated.sender._id.toString(),
    };
    populated.receiver = populated.receiver.toString();
    if (populated.post) populated.post = populated.post.toString();

    // Use rooms — io.to(userId) works regardless of reconnects or multiple tabs
    // No need for a manual onlineUsers map anymore
    // const { getIO } = require("../sockets/notificationSocket");
    // const io = getIO();

    const {getIO}=require("../sockets/socket");
    const io = getIO();

    if (io) {
      io.to(receiver.toString()).emit("newNotification", populated);
      console.log("✅ Notification emitted to room:", receiver.toString());
    } else {
      console.warn("⚠️ io not available in createNotification");
    }

    return populated;
  } catch (error) {
    console.error("createNotification error:", error.message);
    return null;
  }
};

// ── CREATE NOTIFICATION (API route handler) ───────────────────────────────────
exports.createNotificationAPI = async (req, res) => {
  try {
    const { receiver, type, post } = req.body;
    const notification = await exports.createNotification({
      sender: req.user.id,
      receiver,
      type,
      post,
    });
    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};