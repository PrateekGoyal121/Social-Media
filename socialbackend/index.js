const express = require("express");
const dotenv = require("dotenv");
const {cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const notificationSocket = require("./sockets/notificationSocket");
const chatSocket = require("./sockets/chatSocket");

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

//cloudinary connection
cloudinaryConnect();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

notificationSocket(io);
chatSocket(io);

// make socket accessible in controllers
app.set("io", io);


const post=require("./routes/postRoutes");
app.use('/api/v1/post',post);

const auth = require("./routes/authRoutes");
app.use("/api/v1", auth);

const user = require("./routes/userRoutes");
app.use("/api/v1/user", user);

const notify = require("./routes/notificationRoutes");
app.use("/api/v1/notify", notify);

const chat = require("./routes/chatRoutes");
app.use("/api/v1/chat", chat);

server.listen(PORT, () => {
  console.log(`APP is listening at ${PORT}`);
});
