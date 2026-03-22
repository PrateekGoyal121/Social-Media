import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsers } from "../services/postService";

function SearchBar() {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const debounceRef              = useRef(null);
  const wrapperRef               = useRef(null);
  const navigate                 = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setResults([]);
      setShowDrop(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchUsers(val.trim());
        setResults(data.users || []);
        setShowDrop(true);
      } catch (err) {
        console.log("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = (userId) => {
    setShowDrop(false);
    setQuery("");
    navigate(`/profile/${userId}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && results.length === 1) {
      handleSelect(results[0]._id);
    } else if (e.key === "Escape") {
      setShowDrop(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">

      <div className="relative">
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDrop(true)}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 outline-none text-sm pr-10"
        />

        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showDrop && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg mt-1 z-50 overflow-hidden">

          {results.length > 0 ? (
            results.map((user) => (
              <div
                key={user._id}
                onClick={() => handleSelect(user._id)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition"
              >
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-gray-400">
                    {user.followers?.length || 0} followers
                  </p>
                </div>
              </div>
            ))
          ) : (
            !loading && (
              <div className="px-4 py-3 text-sm text-gray-400">
                No users found for "{query}"
              </div>
            )
          )}

        </div>
      )}

    </div>
  );
}

export default SearchBar;