import {
  useEffect,
  useState,
  useContext,
  useCallback,
} from "react";
import { useParams, useNavigate } from "react-router-dom";

import PostModel from "../components/PostModel";
import { getUserProfile, followUnfollowUser } from "../services/userService";
import { getUserPosts, getSavedPosts } from "../services/postService";
import { AuthContext } from "../context/AuthContext";

import toast, { Toaster } from "react-hot-toast";
import { FaTimes, FaEdit, FaThLarge, FaBookmark } from "react-icons/fa";

// ─── helpers ──────────────────────────────────────────────────────────────────

const dedupeUsers = (arr = []) =>
  Array.from(new Map(arr.map((u) => [u._id, u])).values());

const includesId = (arr = [], targetId) =>
  arr.some((item) =>
    typeof item === "string" ? item === targetId : item._id === targetId
  );

// ─────────────────────────────────────────────────────────────────────────────

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: loggedUser, updateUser } = useContext(AuthContext);

  const [profileUser, setProfileUser]     = useState(null);
  const [posts, setPosts]                 = useState([]);
  const [savedPosts, setSavedPosts]       = useState([]);
  const [savedLoading, setSavedLoading]   = useState(false);
  const [isFollowing, setIsFollowing]     = useState(false);
  const [modalType, setModalType]         = useState(null);
  const [selectedPost, setSelectedPost]   = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab]         = useState("posts");

  // ── fetch profile ──────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getUserProfile(id);
      const userData = data.user || data;
      setProfileUser(userData);
      setIsFollowing(userData.followers.some((f) => f._id === loggedUser._id));
    } catch {
      toast.error("Failed to load profile");
    }
  }, [id, loggedUser._id]);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await getUserPosts(id);
      setPosts(data.posts || []);
    } catch {
      toast.error("Failed to load posts");
    }
  }, [id]);

  const fetchSavedPosts = useCallback(async () => {
    if (savedLoading) return;
    setSavedLoading(true);
    try {
      const data = await getSavedPosts();
      setSavedPosts(data.posts || []);
    } catch {
      toast.error("Failed to load saved posts");
    } finally {
      setSavedLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!id) return;
    fetchProfile();
    fetchPosts();
  }, [id, fetchProfile, fetchPosts]);

  useEffect(() => {
    if (activeTab === "saved" && loggedUser._id === id) {
      fetchSavedPosts();
    }
  }, [activeTab, id, loggedUser._id]); // eslint-disable-line

  // ── follow / unfollow ──────────────────────────────────────────────────────

  const handleFollowProfile = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setProfileUser((prev) => {
      if (!prev) return prev;
      const followers = wasFollowing
        ? prev.followers.filter((f) => f._id !== loggedUser._id)
        : [...prev.followers, { _id: loggedUser._id, username: loggedUser.username, profilePic: loggedUser.profilePic }];
      return { ...prev, followers };
    });
    updateUser({
      ...loggedUser,
      following: wasFollowing
        ? loggedUser.following.filter((fid) => fid !== profileUser._id)
        : [...new Set([...loggedUser.following, profileUser._id])],
    });
    try {
      await followUnfollowUser(profileUser._id);
    } catch {
      toast.error("Action failed");
      setIsFollowing(wasFollowing);
      fetchProfile();
    } finally {
      setFollowLoading(false);
    }
  };

  const handleFollowUser = async (targetId, targetUserObj) => {
    const wasFollowing = includesId(loggedUser.following, targetId);
    updateUser({
      ...loggedUser,
      following: wasFollowing
        ? loggedUser.following.filter((fid) => fid !== targetId)
        : [...new Set([...loggedUser.following, targetId])],
    });
    setProfileUser((prev) => {
      if (!prev) return prev;
      if (modalType === "following") {
        const following = wasFollowing
          ? prev.following.filter((f) => (typeof f === "string" ? f : f._id) !== targetId)
          : [...prev.following, targetUserObj || { _id: targetId }];
        return { ...prev, following };
      }
      if (targetId === prev._id) {
        const followers = wasFollowing
          ? prev.followers.filter((f) => f._id !== loggedUser._id)
          : [...prev.followers, { _id: loggedUser._id, username: loggedUser.username, profilePic: loggedUser.profilePic }];
        return { ...prev, followers };
      }
      return prev;
    });
    if (targetId === profileUser._id) setIsFollowing(!wasFollowing);
    try {
      await followUnfollowUser(targetId);
    } catch {
      toast.error("Action failed");
      fetchProfile();
      updateUser({ ...loggedUser });
    }
  };

  // ── derived ────────────────────────────────────────────────────────────────

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  const isOwnProfile    = loggedUser._id === profileUser._id;
  const uniqueFollowers = dedupeUsers(profileUser.followers);
  const uniqueFollowing = dedupeUsers(profileUser.following);
  const modalUsers      = modalType ? dedupeUsers(profileUser[modalType]) : [];

  // tabs — Tagged removed, Saved only on own profile
  const tabs = [
    { key: "posts", icon: <FaThLarge size={11} />, label: "POSTS" },
    ...(isOwnProfile ? [{ key: "saved", icon: <FaBookmark size={11} />, label: "SAVED" }] : []),
  ];

  // ── render ─────────────────────────────────────────────────────────────────

  return (
  <div className="min-h-screen bg-black text-gray-100">

    <Toaster position="top-right" />

    <div className="max-w-[935px] mx-auto px-4 pt-6 sm:pt-8 pb-16">

      {/* ═══ PROFILE HEADER ═══ */}
      <header className="flex flex-row items-center sm:items-start gap-6 sm:gap-16 mb-5 sm:mb-11">

        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 sm:w-[150px] sm:h-[150px] rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-fuchsia-500 to-blue-600">
            <img
              src={profileUser.profilePic}
              alt={profileUser.username}
              className="w-full h-full rounded-full object-cover border-[3px] border-[#0b0b0c]"
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">

          {/* Username + buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
            <h1 className="text-base sm:text-xl font-bold tracking-wide">
              {profileUser.username}
            </h1>

            {isOwnProfile ? (
              <button
                onClick={() => navigate("/edit-profile")}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-[6px] rounded-lg bg-[#1a1a1d] hover:bg-[#222226] text-xs sm:text-sm font-semibold transition"
              >
                <FaEdit size={11} /> Edit profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleFollowProfile}
                  disabled={followLoading}
                  className={`px-4 sm:px-6 py-[6px] rounded-lg text-xs sm:text-sm font-semibold transition disabled:opacity-60 ${
                    isFollowing
                      ? "bg-[#1a1a1d] hover:bg-[#222226]"
                      : "bg-[#0095F6] hover:bg-[#1877F2] text-white"
                  }`}
                >
                  {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                </button>

                {isFollowing && (
                  <button onClick={() => navigate("/chat")} className="px-3 sm:px-4 py-[6px] rounded-lg bg-[#1a1a1d] hover:bg-[#222226] text-xs sm:text-sm font-semibold transition">
                    Message
                  </button>
                )}
              </>
            )}
          </div>

          {/* Stats desktop */}
          <div className="hidden sm:flex gap-8 mb-5 text-sm">
            <div>
              <span className="font-semibold">{posts.length}</span>{" "}
              <span className="text-gray-400">posts</span>
            </div>

            <button onClick={() => setModalType("followers")}>
              <span className="font-semibold">{uniqueFollowers.length}</span>{" "}
              <span className="text-gray-400">followers</span>
            </button>

            <button onClick={() => setModalType("following")}>
              <span className="font-semibold">{uniqueFollowing.length}</span>{" "}
              <span className="text-gray-400">following</span>
            </button>
          </div>

          {/* Bio desktop */}
          <div className="hidden sm:block text-sm leading-[18px]">
            <p className="font-semibold">{profileUser.username}</p>
            {profileUser.bio
              ? <p className="text-gray-300 mt-0.5 whitespace-pre-line">{profileUser.bio}</p>
              : <p className="text-gray-500 mt-0.5 italic">No bio yet.</p>}
          </div>
        </div>
      </header>

      {/* Bio mobile */}
      <div className="sm:hidden text-sm mb-3">
        <p className="font-semibold">{profileUser.username}</p>
        {profileUser.bio
          ? <p className="text-gray-300 mt-0.5 whitespace-pre-line">{profileUser.bio}</p>
          : <p className="text-gray-500 mt-0.5 italic">No bio yet.</p>}
      </div>

      {/* Stats mobile */}
      <div className="sm:hidden flex justify-around border-y border-gray-800 py-3 mb-1 text-sm">
        <div className="flex flex-col items-center">
          <span className="font-semibold">{posts.length}</span>
          <span className="text-gray-400 text-xs">posts</span>
        </div>

        <button onClick={() => setModalType("followers")} className="flex flex-col items-center">
          <span className="font-semibold">{uniqueFollowers.length}</span>
          <span className="text-gray-400 text-xs">followers</span>
        </button>

        <button onClick={() => setModalType("following")} className="flex flex-col items-center">
          <span className="font-semibold">{uniqueFollowing.length}</span>
          <span className="text-gray-400 text-xs">following</span>
        </button>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="border-t border-gray-800 flex justify-center gap-6 sm:gap-12 mb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 py-3 text-[10px] sm:text-xs font-semibold tracking-widest border-t -mt-px transition ${
              activeTab === tab.key
                ? "border-white text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ POSTS GRID ═══ */}
      <div className="grid grid-cols-3 gap-[2px] sm:gap-[3px]">
        {(activeTab === "posts" ? posts : savedPosts).map((post) => (
          <div
            key={post._id}
            onClick={() => setSelectedPost(post)}
            className="relative aspect-square cursor-pointer group overflow-hidden bg-[#1a1a1d]"
          >
            <img
              src={post.image}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
          </div>
        ))}
      </div>
    </div>

    {/* POST MODAL */}
    {selectedPost && (
      <PostModel post={selectedPost} onClose={() => setSelectedPost(null)} />
    )}

    {/* FOLLOWERS / FOLLOWING MODAL */}
    {modalType && (
      <div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        onClick={() => setModalType(null)}
      >
        <div
          className="bg-[#121214] w-full max-w-[400px] rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-gray-800"
          style={{ maxHeight: "60vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex items-center justify-center py-3 border-b border-gray-800">
            <h3 className="font-semibold text-sm capitalize">{modalType}</h3>
            <button
              onClick={() => setModalType(null)}
              className="absolute right-4 text-gray-400 hover:text-white"
            >
              <FaTimes size={16} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {modalUsers.map((u) => {
              const iFollow = includesId(loggedUser.following, u._id);
              const isSelf  = u._id === loggedUser._id;

              return (
                <div
                  key={u._id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1d]"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => {
                      setModalType(null);
                      navigate(`/profile/${u._id}`);
                    }}
                  >
                    <img
                      src={u.profilePic}
                      alt={u.username}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    <p className="text-sm font-semibold">{u.username}</p>
                  </div>

                  {!isSelf && (
                    <button
                      onClick={() => handleFollowUser(u._id, u)}
                      className={`px-4 py-[6px] rounded-lg text-sm font-semibold transition ${
                        iFollow
                          ? "bg-[#1a1a1d] hover:bg-[#222226]"
                          : "bg-[#0095F6] hover:bg-[#1877F2] text-white"
                      }`}
                    >
                      {iFollow ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
  </div>
);
}

export default Profile;