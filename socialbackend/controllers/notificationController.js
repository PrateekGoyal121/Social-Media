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
    if (!notification) return res.status(404).json({ message: "Notification not found" });
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
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    if (notification.receiver.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    await notification.deleteOne();
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createNotification = async ({ sender, receiver, type, post }) => {
  try {
    if (!sender || !receiver || !type) return null;
    if (sender.toString() === receiver.toString()) return null;

    const notification = await Notification.create({ sender, receiver, type, post });

    const populated = await Notification.findById(notification._id)
      .populate("sender", "username profilePic")
      .lean();

    // lazy require avoids circular dependency
    const { getIO, getOnlineUsers } = require("../sockets/notificationSocket");
    const io          = getIO();
    const onlineUsers = getOnlineUsers();

    if (io) {
      const receiverSocketId = onlineUsers.get(receiver.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newNotification", populated);
        console.log("✅ Emitted to:", receiver.toString());
      }
    }

    return populated;
  } catch (error) {
    console.error("Notification error:", error.message);
    return null;
  }
};

exports.createNotificationAPI = async (req, res) => {
  try {
    const { receiver, type, post } = req.body;
    await exports.createNotification({ sender: req.user.id, receiver, type, post });
    res.status(201).json({ success: true, message: "Notification created" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};