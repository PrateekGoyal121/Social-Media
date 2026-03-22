const chatSocket = (io) => {
  // Track online users: userId -> Set of socketIds (multi-tab support)
  const onlineUsers = new Map();

  const getOnlineList = () => Array.from(onlineUsers.keys());

  io.on("connection", (socket) => {
    console.log("🔌 connected:", socket.id);

    socket.on("join", (userId) => {
      if (!userId) return;
      const id = userId.toString();
      socket.join(id);
      socket._userId = id;

      // track online
      if (!onlineUsers.has(id)) onlineUsers.set(id, new Set());
      onlineUsers.get(id).add(socket.id);

      // broadcast updated online list to everyone
      io.emit("onlineUsers", getOnlineList());
      console.log("✅ joined room:", id, "| online:", getOnlineList());
    });

    socket.on("typing", ({ receiverId, senderId }) => {
      if (!receiverId || !senderId) return;
      socket.to(receiverId.toString()).emit("typing", { senderId: senderId.toString() });
    });

    socket.on("disconnect", () => {
      const id = socket._userId;
      if (id && onlineUsers.has(id)) {
        onlineUsers.get(id).delete(socket.id);
        if (onlineUsers.get(id).size === 0) onlineUsers.delete(id);
      }
      // broadcast updated online list
      io.emit("onlineUsers", getOnlineList());
      console.log("❌ disconnected:", socket.id, "| online:", getOnlineList());
    });
  });
};

module.exports = chatSocket;