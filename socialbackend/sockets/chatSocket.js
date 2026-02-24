const jwt = require("jsonwebtoken");

const chatSocket = (io) => {
  // Store online users
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    /*
      FRONTEND MUST SEND TOKEN AFTER CONNECTING
      socket.emit("authenticate", token)
    */
    socket.on("authenticate", (token) => {
      try {
        if (!token) return;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Store user socket
        onlineUsers.set(userId, socket.id);

        // Join private room
        socket.join(userId);

        console.log("✅ User authenticated:", userId);
      } catch (err) {
        console.log("❌ Socket authentication failed");
      }
    });

    // Handle real-time message (optional)
    socket.on("sendMessage", ({ senderId, receiverId, text }) => {
      if (!receiverId) return;

      io.to(receiverId).emit("receiveMessage", {
        senderId,
        text,
        createdAt: new Date(),
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);

      // Remove user from online map
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    });
  });
};

module.exports=chatSocket;