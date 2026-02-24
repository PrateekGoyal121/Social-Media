const Message = require("../models/Message");
const mongoose = require("mongoose");

// ==============================
// SEND MESSAGE
// ==============================
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({
        success: false,
        message: "Receiver and text are required",
      });
    }

    // 🔥 IMPORTANT FIX HERE
    const senderId = req.user._id || req.user.id;

    if (!senderId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found in token",
      });
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text,
    });

    // Emit real-time message safely
    const io = req.app.get("io");
    if (io) {
      io.to(receiverId).emit("receiveMessage", message);
    }

    return res.status(200).json({
      success: true,
      message,
    });

  } catch (err) {
    console.log("SEND MESSAGE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// ==============================
// GET CHAT BETWEEN TWO USERS
// ==============================
exports.getChat = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching chat",
    });
  }
};


// ==============================
// MARK MESSAGES AS READ
// ==============================
exports.markAsRead = async (req, res) => {
  try {
    const { senderId } = req.body;

    await Message.updateMany(
      {
        sender: senderId,
        receiver: req.user.id,
        read: false,
      },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error updating messages",
    });
  }
};


// ==============================
// GET CHAT LIST (Last message per user)
// ==============================
exports.getChatList = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const chats = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      chats,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching chat list",
    });
  }
};

// ==============================
// DELETE CHAT (between two users)
// ==============================
exports.deleteChat = async (req, res) => {
  try {
    const { userId } = req.params; // other user's ID
    const currentUserId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    await Message.deleteMany({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error deleting chat",
    });
  }
};

// ==============================
// MARK ALL AS READ (from ALL senders)
// ==============================
exports.markAllAsRead = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    const result = await Message.updateMany(
      {
        receiver: currentUserId,
        read: false,
      },
      { $set: { read: true } }
    );

    return res.status(200).json({
      success: true,
      message: "All unread messages marked as read",
      updatedCount: result.modifiedCount,
    });

  } catch (err) {
    console.log("MARK ALL ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};