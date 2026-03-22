const { createNotification } = require("../controllers/notificationController");

const onlineUsers = new Map();
let ioInstance = null;

const notificationSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    socket.on("join", (userId) => {
      if (!userId) return;
      onlineUsers.set(userId.toString(), socket.id);
      console.log("✅ User joined:", userId);
    });

    socket.on("sendNotification", async (data) => {
      try {
        const { sender, receiver, type, post } = data;
        if (!sender || !receiver || !type) return;
        if (sender.toString() === receiver.toString()) return;

        const notification = await createNotification({ sender, receiver, type, post });
        if (!notification) return;

        const receiverSocketId = onlineUsers.get(receiver.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newNotification", notification);
        }
      } catch (error) {
        console.error("❌ Socket notification error:", error.message);
      }
    });

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

const getIO          = () => ioInstance;
const getOnlineUsers = () => onlineUsers;

module.exports = { notificationSocket, getIO, getOnlineUsers };