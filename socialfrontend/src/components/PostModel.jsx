import { useState, useEffect, useCallback, useRef } from "react";
import {
  toggleLike,
  addComment,
  deleteComment,
  getPostComments,
  toggleSavePost,
} from "../services/postService";

import {
  FaHeart,
  FaRegHeart,
  FaTimes,
  FaTrash,
  FaRegComment,
  FaBookmark,
  FaRegBookmark,
  FaEllipsisH,
} from "react-icons/fa";

import { toast } from "react-hot-toast";

function PostModal({ post, onClose }) {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [liked, setLiked]             = useState(post.likes?.includes(currentUser?._id) ?? false);
  const [likesCount, setLikesCount]   = useState(post.likes?.length || 0);
  const [saved, setSaved]             = useState(post.savedBy?.includes(currentUser?._id) ?? false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [comments, setComments]       = useState([]);
  const [text, setText]               = useState("");
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const commentsEndRef = useRef(null);
  const inputRef       = useRef(null);
  const initialLoad    = useRef(true);

  // ── load comments ──────────────────────────────────────────────────────────

  const loadComments = useCallback(async () => {
    try {
      const data = await getPostComments(post._id);
      setComments(data.comments || []);
    } catch {
      toast.error("Failed to load comments");
    }
  }, [post._id]);

  useEffect(() => { loadComments(); }, [loadComments]);

  useEffect(() => {
    if (initialLoad.current) { initialLoad.current = false; return; }
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── like ───────────────────────────────────────────────────────────────────

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((p) => (newLiked ? p + 1 : p - 1));
    if (newLiked) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 700);
    }
    try {
      await toggleLike(post._id);
    } catch {
      setLiked(!newLiked);
      setLikesCount((p) => (newLiked ? p - 1 : p + 1));
      toast.error("Like failed");
    }
  };

  const handleImageDoubleClick = () => { if (!liked) handleLike(); };

  // ── save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (saveLoading) return;
    setSaveLoading(true);
    const newSaved = !saved;
    setSaved(newSaved);
    try {
      await toggleSavePost(post._id);
      // ✅ toast from top-right, consistent with rest of app
      toast.success(newSaved ? "Post saved" : "Removed from saved", {
        duration: 1500,
      });
    } catch {
      setSaved(!newSaved);
      toast.error("Failed to save post");
    } finally {
      setSaveLoading(false);
    }
  };

  // ── add comment — instant ──────────────────────────────────────────────────

  const handleAddComment = async () => {
    const commentText = text.trim();
    if (!commentText) return;
    setText("");

    const tempId = `temp_${Date.now()}`;
    const tempComment = {
      _id: tempId,
      text: commentText,
      userId: {
        _id: currentUser._id,
        username: currentUser.username,
        profilePic: currentUser.profilePic,
      },
      createdAt: new Date().toISOString(),
      isTemp: true,
    };

    setComments((prev) => [...prev, tempComment]);

    try {
      const res = await addComment(post._id, commentText);
      setComments((prev) =>
        prev.map((c) => {
          if (c._id !== tempId) return c;
          if (res?.comment) {
            return {
              ...res.comment,
              userId: res.comment.userId?._id
                ? res.comment.userId
                : { _id: currentUser._id, username: currentUser.username, profilePic: currentUser.profilePic },
              isTemp: false,
            };
          }
          return { ...c, isTemp: false };
        })
      );
    } catch {
      setComments((prev) => prev.filter((c) => c._id !== tempId));
      setText(commentText);
      toast.error("Failed to post comment");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); }
  };

  // ── delete comment ─────────────────────────────────────────────────────────

  const handleDeleteComment = async (id) => {
    setDeletingIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setComments((c) => c.filter((x) => x._id !== id));
      setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }, 200);
    try {
      await deleteComment(id);
    } catch {
      setDeletingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      loadComments();
      toast.error("Delete failed");
    }
  };

  // ── helpers ────────────────────────────────────────────────────────────────

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (s < 60)     return `${s}s`;
    if (s < 3600)   return `${Math.floor(s / 60)}m`;
    if (s < 86400)  return `${Math.floor(s / 3600)}h`;
    if (s < 604800) return `${Math.floor(s / 86400)}d`;
    return `${Math.floor(s / 604800)}w`;
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
  <div
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-md"
    onClick={onClose}
  >
    <div
      className="relative bg-zinc-900 text-white w-full sm:w-auto sm:max-w-5xl sm:rounded-2xl rounded-t-3xl overflow-hidden flex flex-col sm:flex-row border border-zinc-800"
      style={{ height: "92vh", maxHeight: "92vh" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* CLOSE */}
      <button
        onClick={onClose}
        className="absolute right-3 top-3 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
      >
        <FaTimes size={13} />
      </button>

      {/* IMAGE */}
      <div
        className="relative bg-black flex items-center justify-center overflow-hidden cursor-pointer sm:w-[56%]"
        onDoubleClick={handleImageDoubleClick}
      >
        <img
          src={post.image}
          alt=""
          className="w-full h-full object-contain"
        />

        {likeAnimating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <FaHeart
              size={90}
              className="text-white drop-shadow-2xl"
              style={{ animation: "heartPop 0.7s ease-out forwards" }}
            />
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col bg-zinc-900">

        {/* AUTHOR */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <img
              src={post.author?.profilePic}
              alt=""
              className="w-9 h-9 rounded-full object-cover"
            />
            <p className="font-semibold">{post.author?.username}</p>
          </div>

          <FaEllipsisH className="text-gray-400" />
        </div>

        {/* CAPTION */}
        {post.content && (
          <div className="px-4 py-4 border-b border-zinc-800">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-white mr-2">
                {post.author?.username}
              </span>
              {post.content}
            </p>
          </div>
        )}

        {/* COMMENTS */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {comments.length === 0 && (
            <p className="text-center text-gray-500 text-sm">
              No comments yet
            </p>
          )}

          {comments.map((c) => (
            <div key={c._id} className="flex gap-3">
              <img
                src={c.userId?.profilePic}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />

              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold text-white mr-2">
                    {c.userId?.username}
                  </span>
                  <span className="text-gray-300">{c.text}</span>
                </p>

                {currentUser?._id === c.userId?._id && (
                  <button
                    onClick={() => handleDeleteComment(c._id)}
                    className="text-xs text-red-400 mt-1"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="px-4 py-3 border-t border-zinc-800">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={handleLike}>
              {liked ? (
                <FaHeart size={26} className="text-red-500" />
              ) : (
                <FaRegHeart size={26} className="text-gray-300" />
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={saveLoading}
              className="ml-auto"
            >
              {saved ? (
                <FaBookmark size={22} />
              ) : (
                <FaRegBookmark size={22} className="text-gray-300" />
              )}
            </button>
          </div>

          <p className="font-semibold">
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </p>
        </div>

        {/* ADD COMMENT */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-zinc-800">
          <img
            src={currentUser?.profilePic}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            className="flex-1 bg-zinc-800 rounded-full px-4 py-2 text-sm outline-none placeholder-gray-500"
          />

          <button
            onClick={handleAddComment}
            disabled={!text.trim()}
            className="text-sm font-semibold text-blue-400 disabled:text-gray-600"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  </div>
);
}

export default PostModal;