const express = require("express");
const {
  createPost,
  getFeedPosts,
  toggleLike,
  deletePost,
  getSinglePost,
  getUserPosts,
} = require("../controllers/postController");

const { auth } = require("../middleware/authMiddleware");

const router = express.Router();
const {imageUpload} =require("../controllers/fileUpload");
router.post("/imageUpload",imageUpload);

router.post("/", auth, createPost);
router.get("/feed", auth, getFeedPosts);
router.get("/user/:userId", auth, getUserPosts);
router.get("/:postId", auth, getSinglePost);
router.put("/:postId/like", auth, toggleLike);
router.delete("/:postId", auth, deletePost);

module.exports = router;
