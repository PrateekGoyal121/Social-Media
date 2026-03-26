import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../services/notificationService";
import socket from "../socket";
import { FaHeart, FaComment, FaUserPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import Loader from "../components/Loader";

const typeIcon = (type) => {
  if (type === "like")    return <FaHeart    className="text-red-500"   size={14} />;
  if (type === "comment") return <FaComment  className="text-blue-500"  size={14} />;
  if (type === "follow")  return <FaUserPlus className="text-green-500" size={14} />;
};

const typeText = (type) => {
  if (type === "like")    return "liked your post";
  if (type === "comment") return "commented on your post";
  if (type === "follow")  return "started following you";
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return `${diff}s`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  // ── Fetch on mount ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data.notifications || []);
      } catch {
        toast.error("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Real-time listener only (App.js handles connect + join) ───────
  useEffect(() => {
    const handleNew = (notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id?.toString() === notification._id?.toString())) return prev;
        return [notification, ...prev];
      });
      toast(`🔔 ${notification.sender?.username} ${typeText(notification.type)}`);
    };

    socket.on("newNotification", handleNew);
    return () => socket.off("newNotification", handleNew);
  }, []);

  // ── Mark single read ──────────────────────────────────────────────
  const handleClick = async (n) => {
    if (!n.isRead) {
      try {
        await markAsRead(n._id);
        setNotifications((prev) =>
          prev.map((item) => item._id === n._id ? { ...item, isRead: true } : item)
        );
      } catch {
        toast.error("Failed to mark as read");
      }
    }
    if (n.type === "follow") navigate(`/profile/${n.sender._id}`);
    else if (n.post)         navigate(`/profile/${n.sender._id}`);
  };

  // ── Mark all read ─────────────────────────────────────────────────
  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast("Notification removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
  <div className="bg-black min-h-screen">
    <div className="max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-white">Notifications</h2>

          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="text-xs text-[#4da6ff] font-semibold hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex justify-center mt-20">
          <Loader />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-24 gap-3">
          <div className="w-16 h-16 rounded-full bg-[#0a0a0a] border border-[#1a1a1a] flex items-center justify-center">
            <FaHeart size={24} className="text-[#333]" />
          </div>
          <p className="text-[#666] text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">

          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleClick(n)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition group border ${
                n.isRead
                  ? "bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#262626]"
                  : "bg-[#111] border-[#1f3b57] hover:border-[#2f5f8f]"
              }`}
            >
              {/* PROFILE IMAGE */}
              <div className="relative flex-shrink-0">
                <img
                  src={n.sender?.profilePic || "/avatar.png"}
                  alt={n.sender?.username}
                  className="w-11 h-11 rounded-full object-cover"
                />

                <div className="absolute -bottom-0.5 -right-0.5 bg-black rounded-full p-0.5">
                  {typeIcon(n.type)}
                </div>
              </div>

              {/* TEXT */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#ddd]">
                  <span className="font-semibold text-white">
                    {n.sender?.username}
                  </span>{" "}
                  {typeText(n.type)}
                </p>

                <p className="text-xs text-[#666] mt-0.5">
                  {timeAgo(n.createdAt)}
                </p>
              </div>

              {/* UNREAD DOT */}
              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              )}

              {/* DELETE BUTTON */}
              <button
                onClick={(e) => handleDelete(e, n._id)}
                className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-500 transition flex-shrink-0"
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
}

export default Notifications;