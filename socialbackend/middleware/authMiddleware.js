require("dotenv").config();
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.header("Authorization")?.replace("Bearer ", "")|| req.body.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token Missing",
      });
    }

    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decode;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Auth error",
    });
  }
};

module.exports = { auth };