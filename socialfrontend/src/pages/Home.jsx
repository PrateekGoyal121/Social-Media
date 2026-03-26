import { useEffect, useState } from "react";
import { getAllPosts } from "../services/postService";
import PostCard from "../components/PostCard";
import SearchBar from "../components/SearchBar";
import SuggestedUsers from "../components/SuggestedUsers";
import Loader from "../components/Loader";

function Home() {
  const [posts, setPosts]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showSuggested, setShowSuggested] = useState(false);

  useEffect(() => { loadFeed(); }, []);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const data = await getAllPosts();
      setPosts(data.posts || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black min-h-full">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">

        {/* ── MOBILE: suggested users toggle ── */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowSuggested((p) => !p)}
            className="w-full flex items-center justify-between bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-sm font-medium text-[#aaa] hover:border-[#262626] transition"
          >
            <span>Suggested for you</span>
            <span className="text-[#444] text-xs">
              {showSuggested ? "▲ Hide" : "▼ Show"}
            </span>
          </button>

          {showSuggested && (
            <div className="mt-2">
              <SuggestedUsers />
            </div>
          )}
        </div>

        <div className="flex gap-6 xl:gap-8">

          {/* ── LEFT: FEED ── */}
          <div className="flex-1 min-w-0">

            {/* SEARCH BAR */}
            <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md pt-1 pb-3">
              <SearchBar />
            </div>

            {/* POSTS */}
            <div className="mt-2 space-y-4 sm:space-y-5">
              {loading ? (
                <div className="flex justify-center mt-16">
                  <Loader />
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-20 gap-3">
                  <div className="w-16 h-16 rounded-full border border-[#262626] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" width="28" height="28">
                      <rect x="3" y="3" width="18" height="18" rx="3"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                  </div>
                  <p className="text-[#555] text-sm">No posts yet</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))
              )}
            </div>
          </div>

          {/* ── RIGHT: SUGGESTED USERS (desktop only) ── */}
          <div className="w-72 flex-shrink-0 hidden lg:block">
            <div className="sticky top-6">
              <SuggestedUsers />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Home;