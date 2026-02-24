const express = require("express");
const dotenv = require("dotenv");
const { cloudinaryConnect } = require("./config/cloudinary");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// DB connect
const connectDB = require("./config/db");
connectDB();

// middleware
app.use(express.json());
app.use(cookieParser());

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// cloudinary
cloudinaryConnect();

// Create HTTP server (IMPORTANT for socket)
const server = http.createServer(app);

// Create socket server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});



// routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/v1", authRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/v1/user", userRoutes);

const postRoutes = require("./routes/postRoutes");
app.use("/api/v1/post", postRoutes);

const chatRoutes = require("./routes/chatRoutes");
app.use("/api/v1/chat", chatRoutes);

// socket logic
require("./sockets/chatSocket")(io);

// start server
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket running on port ${PORT}`);
});