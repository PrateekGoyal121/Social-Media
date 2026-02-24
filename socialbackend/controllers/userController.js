const User = require("../models/User");
const Post = require("../models/Post");
const cloudinary = require("cloudinary").v2;

const { createNotification } = require("./notificationController");


exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers following", "username profilePic");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
        success: true,
        user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */

exports.updateUserProfile = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    
    const { username, bio } = req.body;
    let profilePic = "";

    if (req.files && req.files.profilePic) {
      const file = req.files.profilePic;

      const supportedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!supportedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only JPG, JPEG, PNG allowed",
        });
      }

      const result = await cloudinary.uploader.upload(
        file.tempFilePath,
        {
          folder: "profile_pics",
          resource_type: "image",
        }
      );

      profilePic = result.secure_url;
    }


    // 🔄 Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(username && { username }),
        ...(bio && { bio }),
        ...(profilePic && { profilePic }),
      },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/**
 * @desc    Follow or Unfollow user
 * @route   PUT /api/users/follow/:id
 * @access  Private
 */
exports.followUnfollowUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(req.params.id);
      userToFollow.followers.pull(req.user.id);

      await currentUser.save();
      await userToFollow.save();

      res.status(200).json({ message: "User unfollowed" });
    } else {
      // Follow
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.user.id);

      await currentUser.save();
      await userToFollow.save();

      // 🔔 CREATE NOTIFICATION (THIS WAS MISSING)
      await createNotification({
        sender: req.user.id,
        receiver: userToFollow._id,
        type: "follow",
      });

      res.status(200).json({ message: "User followed" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/**
 * @desc    Get followers & following list
 * @route   GET /api/users/connections/:id
 * @access  Private
 */
exports.getUserConnections = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("followers", "username profilePic")
      .populate("following", "username profilePic");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      followers: user.followers,
      following: user.following,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.deleteUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Remove likes made by the user
    await Post.updateMany(
      { likes: userId },
      { $pull: { likes: userId } }
    );

    // Delete user's posts
    await Post.deleteMany({ author: userId });

    // Remove user from followers/following
    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User and all related data deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};