const Message    = require("../models/Message");
const mongoose   = require("mongoose");
const cloudinary = require("cloudinary").v2;

const getId = (req) => (req.user._id || req.user.id).toString();

// Convert Mongoose doc to plain object so socket.io serializes
// identically to res.json() — _id, sender, receiver all strings
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
    if (io) io.to(receiverId.toString()).emit("receiveMessage", message);

    return res.status(200).json({ success: true, message });
  } catch (err) {
    console.error("sendMessage:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── SEND IMAGE (+ optional caption) ──────────────────────────────────────────
// Message text is stored as JSON: { imageUrl, caption }
// so ChatBubble can render the image and caption together in one bubble.
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

    const upload  = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "chat_images", resource_type: "image",
    });

    // Store as JSON so caption and imageUrl travel together in one message
    const text = JSON.stringify({ imageUrl: upload.secure_url, caption: caption.trim() });

    const doc     = await Message.create({ sender: senderId, receiver: receiverId, text });
    const message = plain(doc);

    const io = req.app.get("io");
    if (io) io.to(receiverId.toString()).emit("receiveMessage", message);

    return res.status(200).json({ success: true, message });
  } catch (err) {
    console.error("sendImageMessage:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

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
    }).sort({ createdAt: 1 }).lean();
    return res.status(200).json({ success: true, messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── MARK READ ─────────────────────────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
  try {
    const me           = getId(req);
    const { senderId } = req.body;
    await Message.updateMany(
      { sender: senderId, receiver: me, read: false },
      { $set: { read: true } }
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET CHAT LIST ─────────────────────────────────────────────────────────────
exports.getChatList = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(getId(req));
    const chats  = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
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
    return res.status(200).json({ success: true, chats });
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
    await Message.deleteMany({
      $or: [{ sender: me, receiver: other }, { sender: other, receiver: me }],
    });
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