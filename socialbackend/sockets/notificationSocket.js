const { createNotification } = require("../controllers/notificationController");

const notificationSocket = (io) => {
  // Store online users: userId -> socketId
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    /**
     * 📌 User joins with userId
     */
    socket.on("join", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId.toString(), socket.id);
      console.log("✅ User joined:", userId);
    });

    /**
     * 🔔 Send notification in real-time
     * Triggered from frontend/controllers
     */
    socket.on("sendNotification", async (data) => {
      try {
        const { sender, receiver, type, post } = data;

        // ✅ SAFETY CHECKS (VERY IMPORTANT)
        if (!sender || !receiver || !type) {
          console.error("❌ Invalid notification data:", data);
          return;
        }

        // 🚫 Avoid self-notification
        if (sender.toString() === receiver.toString()) return;

        // ✅ Create notification using single source of truth
        const notification = await createNotification({
          sender,
          receiver,
          type,
          post,
        });

        if (!notification) return;

        // Emit notification if receiver is online
        const receiverSocketId = onlineUsers.get(receiver.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newNotification", notification);
        }
      } catch (error) {
        console.error("❌ Socket notification error:", error.message);
      }
    });

    /**
     * ❌ User disconnects
     */
    socket.on("disconnect", () => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      console.log("🔴 User disconnected:", socket.id);
    });
  });
};

module.exports = notificationSocket;