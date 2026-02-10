const express = require("express");
const dotenv = require("dotenv");
const {cloudinaryConnect } = require("./config/cloudinary");
//const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// DB connect
const connectDB = require("./config/db");
connectDB();

// middleware
app.use(express.json());
app.use(cookieParser());  

app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

const fileUpload = require("express-fileupload");

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

//cloudinary connection
cloudinaryConnect();

app.listen(PORT, () => {
  console.log(`APP is listening at ${PORT}`);
});
const auth = require("./routes/authRoutes");
app.use("/api/v1", auth);

const user = require("./routes/userRoutes");
app.use("/api/v1/user", user);

const post=require("./routes/postRoutes");
app.use('/api/v1/post',post);

const chat=require("./routes/chatRoutes");
app.use("/api/v1/chat",chat)


