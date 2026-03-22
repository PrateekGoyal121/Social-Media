import { useEffect, useState } from "react";
import { getAllPosts } from "../services/postService";
import PostCard from "../components/PostCard";
import SearchBar from "../components/SearchBar";
import SuggestedUsers from "../components/SuggestedUsers";
import Loader from "../components/Loader";

function Home() {
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
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
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">

      {/* ── MOBILE: suggested users toggle ──────────────────────── */}
      <div className="lg:hidden mb-3">
        <button
          onClick={() => setShowSuggested((p) => !p)}
          className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700"
        >
          <span>Suggested for you</span>
          <span className="text-gray-400 text-xs">
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

        {/* ── LEFT: FEED ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* SEARCH BAR */}
          <div className="sticky top-0 z-20 bg-gray-100/80 backdrop-blur-md pt-3 pb-2 px-1">
           <SearchBar />
          </div>

          {/* POSTS */}
          <div className="mt-4 space-y-4 sm:space-y-6">
            {loading ? (
              <div className="flex justify-center mt-10">
                <Loader />
              </div>
            ) : posts.length === 0 ? (
              <p className="text-center text-gray-400 mt-10 text-sm">
                No posts yet
              </p>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: SUGGESTED USERS (desktop only) ───────────────── */}
        <div className="w-72 flex-shrink-0 hidden lg:block">
          <div className="sticky top-6">
            <SuggestedUsers />
          </div>
        </div>

      </div>
    </div>
  );
}

export default Home;