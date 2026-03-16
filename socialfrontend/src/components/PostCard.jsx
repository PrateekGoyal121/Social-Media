import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  toggleLike,
  deletePost,
  addComment,
  deleteComment,
  getPostComments
} from "../services/postService";

import {
  FaHeart,
  FaRegHeart,
  FaTrash,
  FaRegComment,
  FaPaperPlane,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";

import { toast } from "react-hot-toast";

function PostCard({ post }) {

  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);

  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);

  const [liked, setLiked] = useState(
    post.likes?.includes(currentUser?._id)
  );

  // =========================
  // LOAD COMMENTS
  // =========================

  const loadComments = async () => {
    try {

      const data = await getPostComments(post._id);

      setComments(data.comments || []);

    } catch (err) {

      console.log(err);
      toast.error("Failed to load comments");

    }
  };

  // Load comment count when post loads
  useEffect(() => {

    loadComments();

  }, [post._id]);

  // Load comments when dropdown opens
  useEffect(() => {

    if (showComments) {
      loadComments();
    }

  }, [showComments]);

  // =========================
  // LIKE POST
  // =========================

  const handleLike = async () => {

    try {

      await toggleLike(post._id);

      if (liked) {

        setLikesCount(prev => prev - 1);
        toast("💔 Like removed");

      } else {

        setLikesCount(prev => prev + 1);
        toast.success("❤️ Post liked");

      }

      setLiked(!liked);

    } catch (err) {

      toast.error("Like failed");

    }

  };

  // =========================
  // DELETE POST
  // =========================

  const handleDelete = async () => {

    const confirmDelete = window.confirm("Delete this post?");
    if (!confirmDelete) return;

    try {

      await deletePost(post._id);

      toast.success("🗑 Post deleted");

    } catch (err) {

      toast.error("Delete failed");

    }

  };

  // =========================
  // ADD COMMENT
  // =========================

  const handleAddComment = async () => {

    if (!commentText.trim()) return;

    const tempComment = {
      _id: Date.now(),
      text: commentText,
      author: currentUser
    };

    // Instant UI update
    setComments(prev => [...prev, tempComment]);

    setCommentText("");

    try {

      await addComment(post._id, commentText);

      toast.success("💬 Comment added");

    } catch (err) {

      toast.error("Comment failed");

    }

  };

  // =========================
  // DELETE COMMENT
  // =========================

  const handleDeleteComment = async (commentId) => {

    try {

      await deleteComment(commentId);

      setComments(
        comments.filter(c => c._id !== commentId)
      );

      toast("Comment deleted");

    } catch (err) {

      toast.error("Delete failed");

    }

  };

  return (

    <div className="bg-white rounded-xl shadow-md mb-6">

      {/* ================= HEADER ================= */}

      <div className="flex items-center justify-between p-4">

        <div className="flex items-center gap-3">

          <Link to={`/profile/${post.author?._id}`}>
            <img
              src={post.author?.profilePic || "/avatar.png"}
              alt="profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          </Link>

          <Link
            to={`/profile/${post.author?._id}`}
            className="font-semibold"
          >
            {post.author?.username || "User"}
          </Link>

        </div>

        {currentUser?._id === post.author?._id && (

          <button
            onClick={handleDelete}
            className="text-gray-500 hover:text-red-500"
          >
            <FaTrash />
          </button>

        )}

      </div>

      {/* ================= POST IMAGE ================= */}

      {post.image && (

        <img
          src={post.image}
          alt="post"
          className="w-full max-h-[500px] object-cover"
        />

      )}

      {/* ================= ACTION BUTTONS ================= */}

      <div className="flex gap-6 px-4 py-2 text-xl">

        {/* LIKE */}

        <button
          onClick={handleLike}
          className="flex items-center gap-2 hover:scale-110 transition"
        >

          {liked ? (
            <FaHeart className="text-red-500" />
          ) : (
            <FaRegHeart />
          )}

          <span className="text-sm">
            {likesCount}
          </span>

        </button>

        {/* COMMENTS */}

        <button
          onClick={() => setShowComments(prev => !prev)}
          className="flex items-center gap-2 hover:scale-110 transition"
        >

          <FaRegComment />

          <span className="text-sm">
            {comments.length}
          </span>

        </button>

      </div>

      {/* ================= POST CAPTION ================= */}

      {post.content && (

        <div className="px-4 pb-2 flex">

          <p className="font-semibold mr-2">
            {post.author?.username}
          </p>

          <p>
            {post.content}
          </p>

        </div>

      )}

      {/* ================= COMMENT DROPDOWN ================= */}

      <div
        onClick={() => setShowComments(prev => !prev)}
        className="flex items-center gap-2 text-sm px-4 pb-2 cursor-pointer text-gray-600"
      >

        {showComments ? <FaChevronUp /> : <FaChevronDown />}

        {showComments ? "Hide comments" : "View comments"}

      </div>

      {/* ================= COMMENTS ================= */}

      {showComments && (

        <div className="px-4 pb-4">

          {comments.length === 0 && (

            <p className="text-gray-400 text-sm">
              No comments yet
            </p>

          )}

          {comments.map((c) => (

            <div
              key={c._id}
              className="flex justify-between items-center mb-2"
            >

              <p className="text-sm">

                <span className="font-semibold mr-2">
                  {c.userId?.username || "User"}
                </span>

                {c.text}

              </p>

              {currentUser?._id === (c.userId?._id || c.user?._id) && (

                <button
                  onClick={() => handleDeleteComment(c._id)}
                  className="text-xs text-red-500 flex items-center gap-1"
                >
                  <FaTrash />
                </button>

              )}

            </div>

          ))}

          {/* ADD COMMENT */}

          <div className="flex mt-3">

            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border p-2 rounded text-sm"
            />

            <button
              onClick={handleAddComment}
              className="ml-2 text-blue-500 flex items-center gap-1"
            >

              <FaPaperPlane />

            </button>

          </div>

        </div>

      )}

    </div>

  );

}

export default PostCard;