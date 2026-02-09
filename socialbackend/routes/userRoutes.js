const express = require("express");

const {getUserProfile,updateUserProfile,followUnfollowUser,getUserConnections} = require("../controllers/userController");
const {auth} = require("../middleware/authMiddleware");

const router = express.Router();

// Get user profile
router.get("/:id",auth, getUserProfile);

// Update logged-in user profile
router.put("/profile",auth, updateUserProfile);

// Follow / Unfollow user
router.put("/follow/:id",auth, followUnfollowUser);

// Get followers & following
router.get("/connections/:id",auth, getUserConnections);

module.exports = router;
