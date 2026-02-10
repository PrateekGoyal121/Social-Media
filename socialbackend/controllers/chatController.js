const Message = require("../models/Message");
const User = require("../models/User");

// SEND MESSAGE
const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({
        success: false,
        message: "ReceiverId and text are required",
      });
    }

    const message = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      text,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET CHAT BETWEEN TWO USERS
const getChat = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id },
      ],
    })
      .populate("sender", "username profilePic")
      .populate("receiver", "username profilePic")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// MARK MESSAGES AS READ
const markAsRead = async (req, res) => {
  try {
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({
        success: false,
        message: "SenderId is required",
      });
    }

    await Message.updateMany(
      {
        sender: senderId,
        receiver: req.user.id,
        read: false,
      },
      { read: true }
    );

    res.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET CHAT LIST (INBOX)
const getChatList = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id },
      ],
    })
      .populate("sender", "username profilePic")
      .populate("receiver", "username profilePic")
      .sort({ createdAt: -1 });

    const chatMap = new Map();

    messages.forEach((msg) => {
      const otherUser =
        msg.sender._id.toString() === req.user.id
          ? msg.receiver
          : msg.sender;

      if (!chatMap.has(otherUser._id.toString())) {
        chatMap.set(otherUser._id.toString(), {
          user: otherUser,
          lastMessage: msg,
        });
      }
    });

    res.json({
      success: true,
      chats: Array.from(chatMap.values()),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  sendMessage,
  getChat,
  markAsRead,
  getChatList,
};

