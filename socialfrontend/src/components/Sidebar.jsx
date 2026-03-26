import { Link } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { getNotifications } from "../services/notificationService";
import socket from "../socket";

import {
  FiMessageCircle, FiBell, FiUser,
  FiInstagram, FiLogOut, FiPlusSquare,
} from "react-icons/fi";

function Sidebar() {
  const { logout, user }          = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [unread, setUnread]       = useState(0);

  // fetch initial unread count
  useEffect(() => {
    if (!user?._id) return;
    const load = async () => {
      try {
        const data = await getNotifications();
        const count = (data.notifications || []).filter((n) => !n.isRead).length;
        setUnread(count);
      } catch {}
    };
    load();
  }, [user?._id]);

  // shared socket — bump badge on new notification
  useEffect(() => {
  if (!user?._id) return;

  socket.emit("join", user._id);

  const handleNew = () => setUnread((p) => p + 1);
  socket.on("newNotification", handleNew);

  return () => socket.off("newNotification", handleNew);
}, [user?._id]);

  const handleBellClick = () => setUnread(0);

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-20 bg-white border-r flex-col items-center py-6 space-y-10">

        <Link to="/">
          <FiInstagram className="text-3xl cursor-pointer" />
        </Link>

        <Link to="/notifications" onClick={handleBellClick} className="relative">
          <FiBell className="text-2xl hover:scale-110 transition" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        <Link to="/create">
          <FiPlusSquare className="text-2xl hover:scale-110 transition" />
        </Link>

        <Link to="/chat">
          <FiMessageCircle className="text-2xl hover:scale-110 transition" />
        </Link>

        {user && (
          <Link to={`/profile/${user._id}`}>
            <FiUser className="text-2xl hover:scale-110 transition" />
          </Link>
        )}

        <button onClick={() => setShowModal(true)}>
          <FiLogOut className="text-2xl hover:scale-110 transition" />
        </button>

      </div>

      {/* MOBILE BOTTOM NAVBAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around py-3 text-xl md:hidden">

        <Link to="/">
          <FiInstagram />
        </Link>

        <Link to="/notifications" onClick={handleBellClick} className="relative">
          <FiBell />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        <Link to="/create">
          <FiPlusSquare />
        </Link>

        <Link to="/chat">
          <FiMessageCircle />
        </Link>

        {user && (
          <Link to={`/profile/${user._id}`}>
            <FiUser />
          </Link>
        )}

        <button onClick={() => setShowModal(true)}>
          <FiLogOut />
        </button>

      </div>

      {/* LOGOUT MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden w-[260px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center px-6 pt-7 pb-5">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FiLogOut className="text-2xl text-gray-700" />
              </div>
              <h3 className="font-semibold text-gray-900 text-base mb-1">
                Log out?
              </h3>
              <p className="text-sm text-gray-400 text-center">
                You can always log back in at any time.
              </p>
            </div>
            <div className="border-t border-gray-200" />
            <button
              onClick={logout}
              className="w-full py-3 text-sm font-bold text-red-500 hover:bg-gray-50 transition"
            >
              Log out
            </button>
            <div className="border-t border-gray-200" />
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 text-sm text-gray-800 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;