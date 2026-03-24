// sockets/socket.js
let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  const onlineUsers = new Map();
  const getOnlineList = () => Array.from(onlineUsers.keys());

  io.on("connection", (socket) => {
    console.log("🔌 connected:", socket.id);

    socket.on("join", (userId) => {
      if (!userId) return;
      const id = userId.toString();

      socket.join(id);          // join room for chat messages
      socket._userId = id;

      if (!onlineUsers.has(id)) onlineUsers.set(id, new Set());
      onlineUsers.get(id).add(socket.id);

      io.emit("onlineUsers", getOnlineList());
      console.log("✅ joined room:", id);
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
      io.emit("onlineUsers", getOnlineList());
      console.log("❌ disconnected:", socket.id);
    });
  });
};

const getIO = () => ioInstance;

module.exports = { initSocket, getIO };