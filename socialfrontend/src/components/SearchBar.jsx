import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsers } from "../services/postService";
import { FiSearch } from "react-icons/fi";

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
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white text-sm pointer-events-none" />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDrop(true)}
          className="w-full bg-[#111] border border-[#262626] focus:border-[#444] rounded-xl pl-9 pr-10 py-2.5 outline-none text-sm text-white placeholder-white transition"
        />

        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#333] border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showDrop && (
        <div className="absolute top-full left-0 right-0 bg-[#111] border border-[#262626] rounded-xl shadow-2xl mt-1.5 z-50 overflow-hidden">

          {results.length > 0 ? (
            results.map((user) => (
              <div
                key={user._id}
                onClick={() => handleSelect(user._id)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1a1a1a] cursor-pointer transition"
              >
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.username}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-[#262626]"
                />
                <div>
                  <p className="text-sm font-medium text-white">{user.username}</p>
                  <p className="text-xs text-[#555]">
                    {user.followers?.length || 0} followers
                  </p>
                </div>
              </div>
            ))
          ) : (
            !loading && (
              <div className="px-4 py-3 text-sm text-[#555]">
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