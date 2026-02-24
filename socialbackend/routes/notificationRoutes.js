const express = require("express");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,createNotification, createNotificationAPI
} = require("../controllers/notificationController");

const { auth } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * 🔔 Get all notifications for logged-in user
 * GET /api/notifications
 */
router.get("/", auth, getNotifications);

/**
 * 👀 Mark single notification as read
 * PUT /api/notifications/read/:id
 */
router.put("/read/:id", auth, markAsRead);

/**
 * ✅ Mark all notifications as read
 * PUT /api/notifications/read-all
 */
router.put("/read-all", auth, markAllAsRead);

/**
 * 🗑️ Delete a notification
 * DELETE /api/notifications/:id
 */
router.delete("/:id", auth, deleteNotification);

router.post("/create", auth, createNotificationAPI);

module.exports = router;