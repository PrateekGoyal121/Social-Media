import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  toggleLike,
  deletePost,
  addComment,
  deleteComment,
  getPostComments,
  toggleSavePost,
} from "../services/postService";
import {
  FaHeart, FaRegHeart, FaTrash, FaRegComment,
  FaPaperPlane, FaChevronDown, FaChevronUp, FaBookmark, FaRegBookmark,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

function PostCard({ post }) {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [commentText, setCommentText]   = useState("");
  const [comments, setComments]         = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [likesCount, setLikesCount]     = useState(post.likes?.length || 0);
  const [liked, setLiked]               = useState(post.likes?.includes(currentUser?._id));
  const [saved, setSaved]               = useState(post.savedBy?.includes(currentUser?._id));
  const [likeAnim, setLikeAnim]         = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  const loadComments = async () => {
    try {
      const data = await getPostComments(post._id);
      setComments(data.comments || []);
    } catch {
      toast.error("Failed to load comments");
    }
  };

  useEffect(() => { loadComments(); }, [post._id]);
  useEffect(() => { if (showComments) loadComments(); }, [showComments]);

  const handleLike = async () => {
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 300);
    try {
      await toggleLike(post._id);
      setLikesCount((p) => liked ? p - 1 : p + 1);
      setLiked(!liked);
    } catch {
      toast.error("Like failed");
    }
  };

  const handleSave = async () => {
    try {
      await toggleSavePost(post._id);
      setSaved(!saved);
      toast(saved ? "Post unsaved" : "Post saved 🔖");
    } catch {
      toast.error("Save failed");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deletePost(post._id);
      toast.success("Post deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || submitting) return;
    const tempComment = { _id: Date.now(), text: commentText, userId: currentUser };
    setComments((prev) => [...prev, tempComment]);
    setCommentText("");
    setSubmitting(true);
    try {
      await addComment(post._id, commentText);
    } catch {
      toast.error("Comment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      toast("Comment deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
        <Link to={`/profile/${post.author?._id}`} className="flex items-center gap-3">
          <img
            src={post.author?.profilePic || "/avatar.png"}
            alt="profile"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-gray-100 flex-shrink-0"
          />
          <div>
            <p className="font-semibold text-sm leading-tight text-gray-900">
              {post.author?.username || "User"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(post.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          </div>
        </Link>

        {currentUser?._id === post.author?._id && (
          <button
            onClick={handleDelete}
            className="text-gray-300 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50"
          >
            <FaTrash size={12} />
          </button>
        )}
      </div>

      {/* ── CAPTION ── */}
      {post.content && (
        <p className="px-4 sm:px-5 pb-2.5 text-sm text-gray-700 leading-relaxed">
          {post.content}
        </p>
      )}

      {/* ── IMAGE ── */}
      {post.image && (
        <img
          src={post.image}
          alt="post"
          className="w-full max-h-[300px] sm:max-h-[420px] md:max-h-[500px] object-cover"
        />
      )}

      {/* ── ACTION BAR ── */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3">
        <div className="flex items-center gap-4 sm:gap-5">

          {/* LIKE */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-transform active:scale-90 ${likeAnim ? "scale-125" : "scale-100"}`}
          >
            {liked
              ? <FaHeart className="text-red-500" size={19} />
              : <FaRegHeart className="text-gray-500" size={19} />
            }
            <span className="text-sm text-gray-600 font-medium">{likesCount}</span>
          </button>

          {/* COMMENT */}
          <button
            onClick={() => setShowComments((p) => !p)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition active:scale-90"
          >
            <FaRegComment size={19} />
            <span className="text-sm text-gray-600 font-medium">{comments.length}</span>
          </button>

        </div>

        {/* SAVE */}
        <button
          onClick={handleSave}
          className="text-gray-400 hover:text-yellow-500 transition active:scale-90 p-1"
        >
          {saved
            ? <FaBookmark className="text-yellow-500" size={17} />
            : <FaRegBookmark size={17} />
          }
        </button>
      </div>

      {/* ── VIEW COMMENTS TOGGLE ── */}
      <div
        onClick={() => setShowComments((p) => !p)}
        className="flex items-center gap-1.5 text-xs text-gray-400 px-4 sm:px-5 pb-3 cursor-pointer select-none w-fit hover:text-gray-600 transition"
      >
        {showComments ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
        <span>{showComments ? "Hide comments" : `View all ${comments.length} comments`}</span>
      </div>

      {/* ── COMMENTS ── */}
      {showComments && (
        <div className="border-t border-gray-50 px-4 sm:px-5 pt-3 pb-4">

          {comments.length === 0 && (
            <p className="text-gray-300 text-xs mb-3">No comments yet. Be the first!</p>
          )}

          <div className="space-y-3 max-h-48 overflow-y-auto mb-4 pr-1">
            {comments.map((c) => (
              <div key={c._id} className="flex items-start justify-between gap-2 group">
                <div className="flex items-start gap-2.5">
                  <img
                    src={c.userId?.profilePic || "/avatar.png"}
                    alt=""
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover mt-0.5 flex-shrink-0"
                  />
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold mr-1 text-gray-900">
                      {c.userId?.username || "User"}
                    </span>
                    <span className="text-gray-600">{c.text}</span>
                  </p>
                </div>

                {currentUser?._id === (c.userId?._id || c.user?._id) && (
                  <button
                    onClick={() => handleDeleteComment(c._id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition flex-shrink-0 mt-1 p-0.5"
                  >
                    <FaTrash size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* ADD COMMENT */}
          <div className="flex items-center gap-2.5 mt-1">
            <img
              src={currentUser?.profilePic || "/avatar.png"}
              alt=""
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex flex-1 items-center border border-gray-200 rounded-full px-3 sm:px-4 py-2 bg-gray-50 focus-within:border-gray-300 focus-within:bg-white transition">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() || submitting}
                className="text-blue-500 disabled:text-gray-300 hover:text-blue-700 transition ml-2 flex-shrink-0"
              >
                <FaPaperPlane size={13} />
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default PostCard;