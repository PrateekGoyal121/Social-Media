const express = require("express");
const {
  sendMessage,
  sendImageMessage,
  getChat,
  markAsRead,
  getChatList,
  deleteChat,
  markAllAsRead,
} = require("../controllers/chatController");
const { auth } = require("../middleware/authMiddleware");

const router = express.Router();

// Static routes BEFORE dynamic /:userId
router.get("/",                  auth, getChatList);
router.post("/send",             auth, sendMessage);
router.post("/send-image",       auth, sendImageMessage);
router.put("/read",              auth, markAsRead);
router.put("/mark-all-read",     auth, markAllAsRead);
router.delete("/delete/:userId", auth, deleteChat);
router.get("/:userId",           auth, getChat);      // dynamic — always last

module.exports = router;