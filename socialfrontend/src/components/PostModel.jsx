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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full sm:w-auto sm:max-w-5xl sm:rounded-2xl rounded-t-3xl overflow-hidden flex flex-col sm:flex-row"
        style={{ height: "92vh", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          <FaTimes size={13} />
        </button>

        {/* ══ IMAGE ══ */}
        <div
          className="relative bg-black flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer h-[42vw] min-h-[190px] max-h-[320px] sm:h-full sm:max-h-full sm:min-h-0 sm:w-[56%]"
          onDoubleClick={handleImageDoubleClick}
        >
          <img
            src={post.image}
            alt=""
            className="w-full h-full object-cover sm:object-contain"
            loading="lazy"
          />
          {likeAnimating && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <FaHeart
                size={80}
                className="text-white drop-shadow-2xl"
                style={{ animation: "heartPop 0.7s ease-out forwards" }}
              />
              <style>{`
                @keyframes heartPop {
                  0%   { transform: scale(0.2); opacity: 0.9; }
                  45%  { transform: scale(1.3); opacity: 1; }
                  100% { transform: scale(1.1); opacity: 0; }
                }
              `}</style>
            </div>
          )}
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="flex-1 flex flex-col min-h-0 sm:w-[44%] overflow-hidden">

          {/* AUTHOR */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-gray-100 flex-shrink-0 bg-gray-100">
                {post.author?.profilePic ? (
                  <img src={post.author.profilePic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold">
                    {post.author?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-gray-900">{post.author?.username}</p>
            </div>
            <button className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
              <FaEllipsisH size={14} />
            </button>
          </div>

          {/* ══ SCROLLABLE AREA ══ */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* ── CAPTION — distinct full-width block, not a bubble ── */}
            {post.content && (
              <div className="px-4 py-4 border-b border-gray-100 bg-white">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                    {post.author?.profilePic ? (
                      <img src={post.author.profilePic} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                        {post.author?.username?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 leading-relaxed break-words">
                      <span className="font-bold mr-1.5">{post.author?.username}</span>
                      <span className="text-gray-800 font-normal">{post.content}</span>
                    </p>
                    {post.createdAt && (
                      <p className="text-[11px] text-gray-400 mt-1">{formatTime(post.createdAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── COMMENTS — separate section with light bg ── */}
            <div className="px-4 py-3 space-y-3">

              {/* Comments header label */}
              <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Comments
              </p>

              {/* Empty state */}
              {comments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                    <FaRegComment size={18} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No comments yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">Start the conversation</p>
                </div>
              )}

              {/* Comment list — plain rows, no bubble */}
              {comments.map((c) => {
                const isDeleting   = deletingIds.has(c._id);
                const isOwnComment = currentUser?._id === c.userId?._id && !c.isTemp;
                return (
                  <div
                    key={c._id}
                    className="flex gap-3 items-start"
                    style={{ opacity: c.isTemp || isDeleting ? 0.45 : 1, transition: "opacity 0.2s" }}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 mt-0.5">
                      {c.userId?.profilePic ? (
                        <img src={c.userId.profilePic} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                          {c.userId?.username?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>

                    {/* Text — plain, no bubble background */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-snug break-words">
                        <span className="font-bold mr-1.5">{c.userId?.username}</span>
                        <span className="text-gray-700 font-normal">{c.text}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {c.createdAt && (
                          <span className="text-[11px] text-gray-400">{formatTime(c.createdAt)}</span>
                        )}
                        {isOwnComment && (
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            disabled={isDeleting}
                            className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 active:scale-90 transition-all disabled:opacity-30 font-medium"
                          >
                            <FaTrash size={9} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={commentsEndRef} />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex-shrink-0 px-4 pt-3 pb-1.5 border-t border-gray-100">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={handleLike} className="active:scale-75 transition-transform">
                {liked ? (
                  <FaHeart size={25} className="text-red-500" style={{ filter: "drop-shadow(0 0 5px rgba(239,68,68,0.45))" }} />
                ) : (
                  <FaRegHeart size={25} className="text-gray-800 hover:text-gray-500 transition-colors" />
                )}
              </button>
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="ml-auto active:scale-90 transition-transform disabled:opacity-50"
              >
                {saved ? (
                  <FaBookmark size={22} className="text-gray-900" />
                ) : (
                  <FaRegBookmark size={22} className="text-gray-800 hover:text-gray-500 transition-colors" />
                )}
              </button>
            </div>
            <p className="text-sm font-bold text-gray-900">
              {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
            </p>
          </div>

          {/* ADD COMMENT */}
          <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 border-t border-gray-100 bg-white">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
              {currentUser?.profilePic ? (
                <img src={currentUser.profilePic} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                  {currentUser?.username?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment…"
                className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-900 min-w-0"
              />
            </div>
            <button
              onClick={handleAddComment}
              disabled={!text.trim()}
              className="text-sm font-bold text-[#0095F6] disabled:text-gray-300 hover:text-[#1877F2] transition-colors active:scale-95 flex-shrink-0 disabled:cursor-default"
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