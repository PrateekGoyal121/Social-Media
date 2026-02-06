
require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 4000;

//cookie-parser - what is this and why we need this?

require("./config/database").connect();
const cookieParser = require("cookie-parser");
app.use(cookieParser());

//db se connect krna h
// const db = require("./config/database");
// db.connect();

//cloud se connect krna h
// const cloudinary = require("./config/cloudinary");
// cloudinary.cloudinaryConnect();

app.use(express.json());
// const fileupload = require("express-fileupload");
// app.use(fileupload({
//     useTempFiles: true,
//     tempFileDir: path.join(__dirname, "temp/")
// }));

//activate
app.listen(PORT, () => {
    console.log(`APP is listening at ${PORT}`);
})