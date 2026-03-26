const Message    = require("../models/Message");
const User       = require("../models/User");
const mongoose   = require("mongoose");
const cloudinary = require("cloudinary").v2;

const getId = (req) => (req.user._id || req.user.id).toString();

const plain = (doc) => {
  const o    = doc.toObject();
  o._id      = o._id.toString();
  o.sender   = o.sender.toString();
  o.receiver = o.receiver.toString();
  return o;
};

// ── SEND TEXT ─────────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text)
      return res.status(400).json({ success: false, message: "receiverId and text required" });

    const senderId = getId(req);
    const doc      = await Message.create({ sender: senderId, receiver: receiverId, text });
    const message  = plain(doc);

    const io = req.app.get("io");
    if (io) {
      io.to(receiverId.toString()).emit("receiveMessage", message);
      io.to(senderId.toString()).emit("receiveMessage", message);
    }
    return res.status(200).json({ success: true, message });
  } catch (err) {
    console.error("sendMessage:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── SEND IMAGE (+ optional caption) ──────────────────────────────────────────
exports.sendImageMessage = async (req, res) => {
  try {
    const { receiverId, caption = "" } = req.body;
    if (!receiverId)
      return res.status(400).json({ success: false, message: "receiverId required" });
    if (!req.files?.imageFile)
      return res.status(400).json({ success: false, message: "No image file" });

    const senderId = getId(req);
    const file     = req.files.imageFile;
    const ext      = file.name.split(".").pop().toLowerCase();

    if (!["jpg","jpeg","png","gif","webp"].includes(ext))
      return res.status(400).json({ success: false, message: "Unsupported file type" });

    const upload = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "chat_images", resource_type: "image",
    });

    const text    = JSON.stringify({ imageUrl: upload.secure_url, caption: caption.trim() });
    const doc     = await Message.create({ sender: senderId, receiver: receiverId, text });
    const message = plain(doc);

    const io = req.app.get("io");
    if (io) {
      io.to(receiverId.toString()).emit("receiveMessage", message);
      io.to(senderId.toString()).emit("receiveMessage", message);
    }
    return res.status(200).json({ success: true, message });
  } catch (err) {
    console.error("sendImageMessage:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET MESSAGES ──────────────────────────────────────────────────────────────
// ── GET MESSAGES ──────────────────────────────────────────────────────────────
exports.getChat = async (req, res) => {
  try {
    const me    = getId(req);
    const other = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: me,    receiver: other },
        { sender: other, receiver: me    },
      ],
      deletedFor: { $ne: me },
    }).sort({ createdAt: 1 }).lean();
    return res.status(200).json({ success: true, messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── MARK READ ─────────────────────────────────────────────────────────────────
// ── MARK READ — emit socket so sender's blue tick updates instantly ───────────
exports.markAsRead = async (req, res) => {
  try {
    const me = getId(req);
    const { senderId } = req.body;

    // 🔥 1. Get unread IDs FIRST
    const unread = await Message.find(
      { sender: senderId, receiver: me, read: false },
      { _id: 1 }
    ).lean();

    const ids = unread.map(m => m._id.toString());

    // 🔥 2. Update them
    if (ids.length > 0) {
      await Message.updateMany(
        { _id: { $in: ids } },
        { $set: { read: true } }
      );

      // 🔥 3. Emit to sender
      const io = req.app.get("io");
      if (io) {
        io.to(senderId.toString()).emit("messagesRead", {
          by: me,
          messageIds: ids,
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET CHAT LIST (includes following users even with no messages) ─────────────
exports.getChatList = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(getId(req));

    // 1. Get all users that the current user follows
    const currentUser = await User.findById(userId)
      .select("following")
      .populate("following", "_id username profilePic");

    const followingUsers = currentUser?.following || [];

    // 2. Get existing conversations (users you've messaged)
    const chats = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { receiver: userId }],deletedFor:{$ne:userId}, } },
      { $sort:  { createdAt: -1 } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"] },
          lastMessage: { $first: "$$ROOT" },
        },
      },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          username:   "$user.username",
          profilePic: "$user.profilePic",
          lastMessage: {
            _id:       "$lastMessage._id",
            text:      "$lastMessage.text",
            sender:    "$lastMessage.sender",
            receiver:  "$lastMessage.receiver",
            read:      "$lastMessage.read",
            createdAt: "$lastMessage.createdAt",
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    // 3. Collect IDs of users already in chat list
    const chattedIds = new Set(chats.map((c) => c._id.toString()));

    // 4. Build entries for following users who have NO messages yet
    const followingWithNoChat = followingUsers
      .filter((u) => !chattedIds.has(u._id.toString()))
      .map((u) => ({
        _id:         u._id,
        username:    u.username,
        profilePic:  u.profilePic || "",
        lastMessage: null,   // no messages yet
      }));

    // 5. Merge: existing chats first (sorted by time), then following with no chat
    const merged = [...chats, ...followingWithNoChat];

    return res.status(200).json({ success: true, chats: merged });
  } catch (err) {
    console.error("getChatList:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE CHAT ───────────────────────────────────────────────────────────────
exports.deleteChat = async (req, res) => {
  try {
    const me    = getId(req);
    const other = req.params.userId;
    await Message.updateMany({
      $or: [{ sender: me, receiver: other }, { sender: other, receiver: me }],
    },
  {
     $addToSet:{deletedFor:me}
  });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const userId = getId(req);
    const { messageId } = req.params;
    const { deleteFor } = req.body; // "me" or "everyone"

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found" });

    if (deleteFor === "everyone") {
      // only sender can delete for everyone
      if (msg.sender.toString() !== userId)
        return res.status(403).json({ success: false, message: "Not allowed" });
      await Message.findByIdAndDelete(messageId);

      // notify both users via socket
      const io = req.app.get("io");
      if (io) {
        io.to(msg.sender.toString()).emit("messageDeleted", { messageId, deleteFor: "everyone" });
        io.to(msg.receiver.toString()).emit("messageDeleted", { messageId, deleteFor: "everyone" });
      }
    } else {
      await Message.updateOne(
        {_id:messageId},{
          $addToSet:{deletedFor:userId}
        }
      )
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── MARK ALL READ ─────────────────────────────────────────────────────────────
exports.markAllAsRead = async (req, res) => {
  try {
    const me     = getId(req);
    const result = await Message.updateMany(
      { receiver: me, read: false },
      { $set: { read: true } }
    );
    return res.status(200).json({ success: true, updatedCount: result.modifiedCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};