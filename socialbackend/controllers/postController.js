const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const {cloudinary} = require("../Config/cloudinary");

const { createNotification } = require("./notificationController");

// CREATE POST
const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    let imageUrl = "";

    if (req.files && req.files.image) {
      const file = req.files.image;

      const supportedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!supportedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only JPG, JPEG, PNG allowed",
        });
      }

      const result = await cloudinary.uploader.upload(
        file.tempFilePath,
        { folder: "posts", resource_type: "image" }
      );

      imageUrl = result.secure_url;
    }

    const post = await Post.create({
      author: req.user.id,
      content,
      image: imageUrl,
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET FEED POSTS
const getFeedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const posts = await Post.find({
      author: { $in: [...user.following, req.user.id] },
    })
      .populate("author", "username profilePic")
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LIKE / UNLIKE POST
const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    const userId = req.user.id;

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);

      // 🔔 NOTIFICATION (only on LIKE)
      await createNotification({
        sender: userId,
        receiver: post.author._id || post.author,
        type: "like",
        post: post._id,
      });
    }

    await post.save();

    res.json({
      success: true,
      message: isLiked ? "Post unliked" : "Post liked",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE POST
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      console.log("DB POST:", await Post.find());
    console.log("REQ.USER:", req.user);
    console.log("POST AUTHOR:", post.author.toString());
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Post.findByIdAndDelete(post._id);
    await Comment.deleteMany({ postId: post._id });
    console.log("DB POST:", await Post.find());
    console.log("REQ.USER:", req.user);
    console.log("POST AUTHOR:", post.author.toString());

    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE POST
const getSinglePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("author", "username profilePic");

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comments = await Comment.find({ postId: post._id })
      .populate("userId", "username profilePic")
      .sort({ createdAt: -1 });

    res.json({ success: true, post, comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER POSTS
const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate("author", "username profilePic")
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD COMMENT
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = await Comment.create({
      postId,
      userId: req.user.id,
      text,
    });

    await comment.populate("userId", "username profilePic");  //------>

    // 🔔 NOTIFICATION (comment)
    await createNotification({
      sender: req.user.id,
      receiver: post.author,
      type: "comment",
      post: post._id,
    });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE COMMENT
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const posts = await Post.find({})
      .populate("author", "username profilePic")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      page,
      posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL COMMENTS FOR A POST
const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comments = await Comment.find({ postId })
      .populate("userId", "username profilePic")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Toggle save/unsave — PUT /v1/post/:id/save
const toggleSavePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
 
    const userId = req.user.id;
    const alreadySaved = post.savedBy?.includes(userId);
 
    if (alreadySaved) {
      post.savedBy.pull(userId);
    } else {
      post.savedBy.push(userId);
    }
 
    await post.save();
 
    res.status(200).json({
      success: true,
      saved: !alreadySaved,
      message: alreadySaved ? "Post unsaved" : "Post saved",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
// ─── GET SAVED POSTS ──────────────────────────────────────────────────────────
// GET /v1/post/saved
 
const getSavedPosts = async (req, res) => {
  try {
    const posts = await Post.find({ savedBy: req.user.id })
      .populate("author", "username profilePic")
      .sort({ createdAt: -1 });
 
    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SEARCH USERS BY USERNAME
// GET /v1/post/search?username=john
const searchUsers = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, message: "Username is required" });
    }

    const users = await User.find({
      username: { $regex: username.trim(), $options: "i" },
    })
      .select("_id username profilePic followers")
      .limit(10);

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
 
 
// ─────────────────────────────────────────────────────────────
// ADD THIS to your existing userController.js (or a new file)
// ─────────────────────────────────────────────────────────────
 
// GET SUGGESTED USERS
// GET /v1/user/suggestions
const getSuggestedUsers = async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
 
    // Exclude self + people already followed
    const excluded = [...(me.following || []), me._id];
 
    const users = await User.find({ _id: { $nin: excluded } })
      .select("username profilePic followers following")
      .limit(10);
 
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
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
  searchUsers,
  getSuggestedUsers,
};