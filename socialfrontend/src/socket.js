import { io } from "socket.io-client";

// ⚠️  MUST match the port your backend server.js listens on.
// Your server.js: const PORT = process.env.PORT || 4000
// Your api.js baseURL is http://localhost:3000/api  
// → if your server runs on 3000, keep 3000. If 4000, change to 4000.
// Check your terminal — it prints "APP is listening at PORT"
const SOCKET_URL = "http://localhost:3000";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on("connect",       () => console.log("🟢 socket connected:", socket.id));
socket.on("disconnect",    (r) => console.log("🔴 socket disconnected:", r));
socket.on("connect_error", (e) => console.error("🔴 socket error:", e.message));

export default socket;
