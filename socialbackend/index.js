const express = require("express");
const dotenv = require("dotenv");

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

app.listen(PORT, () => {
  console.log(`APP is listening at ${PORT}`);
});
