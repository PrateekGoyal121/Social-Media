// const { createNotification } = require("../controllers/notificationController");

// const onlineUsers = new Map();
// let ioInstance = null;

// const notificationSocket = (io) => {
//   ioInstance = io;

//   io.on("connection", (socket) => {
//     console.log("🔌 User connected:", socket.id);

//     socket.on("join", (userId) => {
//       if (!userId) return;
//       onlineUsers.set(userId.toString(), socket.id);
//       console.log("✅ User joined:", userId);
//     });

//     socket.on("sendNotification", async (data) => {
//       try {
//         const { sender, receiver, type, post } = data;
//         if (!sender || !receiver || !type) return;
//         if (sender.toString() === receiver.toString()) return;

//         const notification = await createNotification({ sender, receiver, type, post });
//         if (!notification) return;

//         const receiverSocketId = onlineUsers.get(receiver.toString());
//         if (receiverSocketId) {
//           io.to(receiverSocketId).emit("newNotification", notification);
//         }
//       } catch (error) {
//         console.error("❌ Socket notification error:", error.message);
//       }
//     });

//     socket.on("disconnect", () => {
//       for (let [userId, socketId] of onlineUsers.entries()) {
//         if (socketId === socket.id) {
//           onlineUsers.delete(userId);
//           break;
//         }
//       }
//       console.log("🔴 User disconnected:", socket.id);
//     });
//   });
// };

// const getIO          = () => ioInstance;
// const getOnlineUsers = () => onlineUsers;

// module.exports = { notificationSocket, getIO, getOnlineUsers };


let ioInstance = null;

const notificationSocket = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    // join event is already handled by chatSocket — but we listen here too
    // so notificationSocket works even if chatSocket is removed later
    socket.on("join", (userId) => {
      if (!userId) return;
      // Use socket.io rooms — same approach as chatSocket
      // This is idempotent: joining the same room twice is safe
      socket.join(userId.toString());
      console.log(`🔔 notificationSocket: ${userId} joined room`);
    });
  });
};

// Always use rooms — no manual map needed
// io.to(userId) works for any number of tabs/reconnects automatically
const getIO = () => ioInstance;

module.exports = { notificationSocket, getIO };