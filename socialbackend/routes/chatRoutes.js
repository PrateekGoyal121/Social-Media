const express = require("express");
const {
  sendMessage,
  getChat,
  markAsRead,
  getChatList,
  deleteChat,
  markAllAsRead,
} = require("../controllers/chatController");
const {auth} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/send", auth, sendMessage);
router.get("/:userId", auth, getChat);
router.put("/read", auth, markAsRead);
router.get("/", auth, getChatList);
router.delete("/delete/:userId", auth, deleteChat);
router.put("/mark-all-read", auth, markAllAsRead);

module.exports = router;
