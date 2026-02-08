const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const {cloudinary} = require("../config/cloudinary");

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
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Post.findByIdAndDelete(post._id);
    await Comment.deleteMany({ postId: post._id });

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

module.exports = {
  createPost,
  getFeedPosts,
  toggleLike,
  deletePost,
  getSinglePost,
  getUserPosts,
};
