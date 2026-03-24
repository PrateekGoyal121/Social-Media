import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSuggestedUsers } from "../services/postService";
import { followUnfollowUser } from "../services/userService";
import { toast } from "react-hot-toast";

function SuggestedUsers() {
  const [users, setUsers]       = useState([]);
  const [followed, setFollowed] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSuggestedUsers();
        setUsers(data.users || []);
      } catch {
        console.log("Failed to load suggestions");
      }
    };
    load();
  }, []);

  const handleFollow = async (userId) => {
    try {
      setFollowed((prev) => ({ ...prev, [userId]: !prev[userId] }));
      await followUnfollowUser(userId);
      toast.success(followed[userId] ? "Unfollowed" : "Followed! 🎉");
    } catch {
      setFollowed((prev) => ({ ...prev, [userId]: !prev[userId] }));
      toast.error("Action failed");
    }
  };

  if (!users.length) return null;

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4">
      <h3 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">
        Suggested for you
      </h3>

      <div className="space-y-4">
        {users.map((user) => (
          <div key={user._id} className="flex items-center justify-between gap-3">
            <Link
              to={`/profile/${user._id}`}
              className="flex items-center gap-3 min-w-0"
            >
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.username}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-[#262626] flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white leading-tight truncate">
                  {user.username}
                </p>
                <p className="text-xs text-[#555] mt-0.5">
                  {user.followers?.length || 0} followers
                </p>
              </div>
            </Link>

            <button
              onClick={() => handleFollow(user._id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition flex-shrink-0 ${
                followed[user._id]
                  ? "bg-[#1a1a1a] text-[#888] hover:bg-[#222] border border-[#262626]"
                  : "bg-white text-black hover:bg-gray-200"
              }`}
            >
              {followed[user._id] ? "Following" : "Follow"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SuggestedUsers;