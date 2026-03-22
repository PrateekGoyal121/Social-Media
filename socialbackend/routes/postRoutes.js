const express = require("express");
const {
  createPost,
  getFeedPosts,
  toggleLike,
  deletePost,
  getSinglePost,
  getUserPosts,
  addComment,
  deleteComment,
  getAllPosts,
  getPostComments,
  toggleSavePost,
  getSavedPosts,
  getSuggestedUsers,
  searchUsers,
} = require("../controllers/postController");

const { auth } = require("../middleware/authMiddleware");
const { imageUpload } = require("../controllers/fileUpload");

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// RULE: All routes with literal path segments (e.g. /feed, /saved, /comment)
//       MUST come before wildcard param routes (/:postId).
//       Otherwise Express matches "saved" as a :postId value → wrong handler.
// ─────────────────────────────────────────────────────────────────────────────

router.post("/imageUpload", imageUpload);

// Create post
router.post("/", auth, createPost);

// Feed — literal strings before /:postId
router.get("/feed", auth, getFeedPosts);
router.get("/feed/all", auth, getAllPosts);        // ✅ moved before /:postId

// Saved posts — literal string before /:postId
router.get("/saved", auth, getSavedPosts);         // ✅ moved before /:postId

router.get("/search", auth, searchUsers);   // GET /v1/post/search/posts?username=john
router.get("/suggestions/users", auth, getSuggestedUsers);  // GET /v1/post/suggestions/users


// Comments
router.post("/comment/:postId", auth, addComment);
router.delete("/delete/:commentId", auth, deleteComment);

// User posts
router.get("/user/:userId", auth, getUserPosts);

// ── /:postId param routes — always last ───────────────────────────────────────
router.get("/:postId", auth, getSinglePost);
router.get("/:postId/getcomments", auth, getPostComments);
router.put("/:postId/like", auth, toggleLike);
router.put("/:postId/save", auth, toggleSavePost); // ✅ save toggle
router.delete("/:postId", auth, deletePost);

module.exports = router;