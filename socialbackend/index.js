const express = require("express");
const dotenv = require("dotenv");
const {cloudinaryConnect } = require("./config/cloudinary");
//const fileUpload = require("express-fileupload");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// DB connect
const connectDB = require("./config/db");
connectDB();

// middleware
app.use(express.json());

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

const post=require("./routes/postRoutes");
app.use('/api/v1',post);

app.listen(PORT, () => {
  console.log(`APP is listening at ${PORT}`);
});
