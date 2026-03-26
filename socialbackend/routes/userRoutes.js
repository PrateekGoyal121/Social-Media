const express = require("express");

const {getUserProfile,updateUserProfile,followUnfollowUser,getUserConnections, deleteUserProfile} = require("../controllers/userController");
const {auth} = require("../middleware/authMiddleware");

const router = express.Router();

// Update logged-in user profile
router.put("/profile",auth, updateUserProfile);

// Follow / Unfollow user
router.put("/follow/:id",auth, followUnfollowUser);

// Get followers & following
router.get("/connections/:id",auth, getUserConnections);

router.delete("/delete", auth, deleteUserProfile);

// Get user profile
router.get("/:id",auth, getUserProfile);

module.exports = router;