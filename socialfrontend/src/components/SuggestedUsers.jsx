import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSuggestedUsers } from "../services/postService";
import { followUnfollowUser } from "../services/userService"; // adjust path if needed
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
      // optimistic toggle
      setFollowed((prev) => ({ ...prev, [userId]: !prev[userId] }));
      await followUnfollowUser(userId);
      toast.success(followed[userId] ? "Unfollowed" : "Followed! 🎉");
    } catch {
      // revert on error
      setFollowed((prev) => ({ ...prev, [userId]: !prev[userId] }));
      toast.error("Action failed");
    }
  };

  if (!users.length) return null;

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="font-semibold text-gray-700 mb-3">Suggested for you</h3>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user._id} className="flex items-center justify-between">
            <Link
              to={`/profile/${user._id}`}
              className="flex items-center gap-2"
            >
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.username}
                className="w-9 h-9 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold leading-tight">
                  {user.username}
                </p>
                <p className="text-xs text-gray-400">
                  {user.followers?.length || 0} followers
                </p>
              </div>
            </Link>

            <button
              onClick={() => handleFollow(user._id)}
              className={`text-xs font-semibold px-3 py-1 rounded-full transition ${
                followed[user._id]
                  ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  : "bg-blue-500 text-white hover:bg-blue-600"
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