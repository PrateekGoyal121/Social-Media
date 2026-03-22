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
    <div className="min-h-screen bg-white">

      {/* Toast always from top-right */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: { marginTop: "8px" },
        }}
      />

      <div className="max-w-[935px] mx-auto px-4 pt-6 sm:pt-8 pb-16">

        {/* ═══ PROFILE HEADER ═══ */}
        <header className="flex flex-row items-center sm:items-start gap-6 sm:gap-16 mb-5 sm:mb-11">

          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 sm:w-[150px] sm:h-[150px] rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-fuchsia-500 to-blue-600">
              <img
                src={profileUser.profilePic}
                alt={profileUser.username}
                className="w-full h-full rounded-full object-cover border-[3px] border-white"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">

            {/* Username + buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-5">
              <h1 className="text-base sm:text-xl font-bold text-gray-900 tracking-wide">
                {profileUser.username}
              </h1>
              {isOwnProfile ? (
                <button
                  onClick={() => navigate("/edit-profile")}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-[6px] rounded-lg bg-gray-100 hover:bg-gray-200 text-xs sm:text-sm font-semibold text-gray-900 transition-colors"
                >
                  <FaEdit size={11} /> Edit profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollowProfile}
                    disabled={followLoading}
                    className={`px-4 sm:px-6 py-[6px] rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-60 ${
                      isFollowing
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-900"
                        : "bg-[#0095F6] hover:bg-[#1877F2] text-white"
                    }`}
                  >
                    {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
                  </button>
                  {isFollowing && (
                    <button className="px-3 sm:px-4 py-[6px] rounded-lg bg-gray-100 hover:bg-gray-200 text-xs sm:text-sm font-semibold text-gray-900 transition-colors">
                      Message
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Stats — desktop */}
            <div className="hidden sm:flex gap-8 mb-5">
              <div className="text-sm">
                <span className="font-semibold text-gray-900">{posts.length}</span>{" "}
                <span className="text-gray-500">posts</span>
              </div>
              <button onClick={() => setModalType("followers")} className="text-sm text-left hover:opacity-60 transition-opacity">
                <span className="font-semibold text-gray-900">{uniqueFollowers.length}</span>{" "}
                <span className="text-gray-500">followers</span>
              </button>
              <button onClick={() => setModalType("following")} className="text-sm text-left hover:opacity-60 transition-opacity">
                <span className="font-semibold text-gray-900">{uniqueFollowing.length}</span>{" "}
                <span className="text-gray-500">following</span>
              </button>
            </div>

            {/* Bio — desktop */}
            <div className="hidden sm:block text-sm leading-[18px]">
              <p className="font-semibold text-gray-900">{profileUser.username}</p>
              {profileUser.bio
                ? <p className="text-gray-800 mt-0.5 whitespace-pre-line">{profileUser.bio}</p>
                : <p className="text-gray-400 mt-0.5 italic">No bio yet.</p>}
            </div>
          </div>
        </header>

        {/* Bio — mobile */}
        <div className="sm:hidden text-sm leading-[18px] mb-3">
          <p className="font-semibold text-gray-900">{profileUser.username}</p>
          {profileUser.bio
            ? <p className="text-gray-800 mt-0.5 whitespace-pre-line">{profileUser.bio}</p>
            : <p className="text-gray-400 mt-0.5 italic">No bio yet.</p>}
        </div>

        {/* Stats bar — mobile */}
        <div className="sm:hidden flex justify-around border-y border-gray-200 py-3 mb-1">
          <div className="flex flex-col items-center">
            <span className="font-semibold text-gray-900 text-sm">{posts.length}</span>
            <span className="text-gray-500 text-xs">posts</span>
          </div>
          <button onClick={() => setModalType("followers")} className="flex flex-col items-center">
            <span className="font-semibold text-gray-900 text-sm">{uniqueFollowers.length}</span>
            <span className="text-gray-500 text-xs">followers</span>
          </button>
          <button onClick={() => setModalType("following")} className="flex flex-col items-center">
            <span className="font-semibold text-gray-900 text-sm">{uniqueFollowing.length}</span>
            <span className="text-gray-500 text-xs">following</span>
          </button>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="border-t border-gray-200 flex justify-center gap-6 sm:gap-12 mb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 py-3 text-[10px] sm:text-xs font-semibold tracking-widest border-t -mt-px transition-colors ${
                activeTab === tab.key
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ POSTS TAB ═══ */}
        {activeTab === "posts" && (
          posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center mb-4">
                <FaThLarge size={20} className="text-gray-300" />
              </div>
              <p className="text-xl font-light tracking-wide text-gray-600">No Posts Yet</p>
              {isOwnProfile && (
                <p className="text-sm text-gray-400 mt-1">Start capturing and sharing your moments.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[2px] sm:gap-[3px]">
              {posts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-square cursor-pointer group overflow-hidden bg-gray-100"
                >
                  <img src={post.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                </div>
              ))}
            </div>
          )
        )}

        {/* ═══ SAVED TAB ═══ */}
        {activeTab === "saved" && (
          savedLoading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center mb-4">
                <FaBookmark size={20} className="text-gray-300" />
              </div>
              <p className="text-xl font-light tracking-wide text-gray-600">No Saved Posts</p>
              <p className="text-sm text-gray-400 mt-1">Posts you save will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[2px] sm:gap-[3px]">
              {savedPosts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-square cursor-pointer group overflow-hidden bg-gray-100"
                >
                  <img src={post.image} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FaBookmark size={14} className="text-white drop-shadow" />
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>

      {/* POST MODAL */}
      {selectedPost && (
        <PostModel post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}

      {/* FOLLOWERS / FOLLOWING MODAL */}
      {modalType && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setModalType(null)}
        >
          <div
            className="bg-white w-full max-w-[400px] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ maxHeight: "60vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-center py-3 border-b border-gray-200 flex-shrink-0">
              <h3 className="font-semibold text-sm text-gray-900 capitalize">{modalType}</h3>
              <button onClick={() => setModalType(null)} className="absolute right-4 text-gray-500 hover:text-gray-900 transition-colors">
                <FaTimes size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {modalUsers.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-12">No {modalType} yet</p>
              ) : modalUsers.map((u) => {
                const iFollow = includesId(loggedUser.following, u._id);
                const isSelf  = u._id === loggedUser._id;
                return (
                  <div key={u._id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div
                      className="flex items-center gap-3 cursor-pointer min-w-0"
                      onClick={() => { setModalType(null); navigate(`/profile/${u._id}`); }}
                    >
                      <img
                        src={u.profilePic || "https://via.placeholder.com/44"}
                        alt={u.username}
                        className="w-11 h-11 rounded-full object-cover flex-shrink-0 bg-gray-100"
                      />
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.username}</p>
                    </div>
                    {!isSelf && (
                      <button
                        onClick={() => handleFollowUser(u._id, u)}
                        className={`ml-3 flex-shrink-0 px-4 py-[6px] rounded-lg text-sm font-semibold transition-colors ${
                          iFollow ? "bg-gray-100 hover:bg-gray-200 text-gray-900" : "bg-[#0095F6] hover:bg-[#1877F2] text-white"
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