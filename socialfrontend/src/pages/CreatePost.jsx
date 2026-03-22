import { useState } from "react";
import { createPost } from "../services/postService";
import { Link } from "react-router-dom";
import { ImagePlus, X, Send } from "lucide-react";

function CreatePost() {

  // ── Real logged-in user (same as PostCard) ──
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!caption && !image) return;
    const formData = new FormData();
    formData.append("content", caption);
    formData.append("image", image);
    try {
      setLoading(true);
      await createPost(formData);
      setCaption("");
      setImage(null);
      setPreview(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const canPost = caption || image;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">

      <div className="cp-wrap w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* ── Top bar ── */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-600 tracking-wide">Create Post</h2>
          <button
            onClick={handleSubmit}
            disabled={loading || !canPost}
            className="cp-post-btn flex items-center gap-2 px-4 py-1.5 rounded-lg text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: canPost && !loading ? "#2563eb" : "#9ca3af" }}
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Posting…
              </>
            ) : (
              <><Send size={13} /> Post</>
            )}
          </button>
        </div>

        {/* ── User Header (real currentUser data) ── */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-3">

          {/* Avatar — real profilePic or fallback */}
          <Link to={`/profile/${currentUser?._id}`} className="relative flex-shrink-0">
            <img
              src={currentUser?.profilePic || "/avatar.png"}
              alt={currentUser?.username || "User"}
              className="w-11 h-11 rounded-full object-cover border-2 border-indigo-100"
            />
            {/* Online dot */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
          </Link>

          {/* Name + email */}
          <div>
            <div className="flex items-center gap-1.5">
              <Link
                to={`/profile/${currentUser?._id}`}
                className="text-sm font-semibold text-gray-900 hover:underline"
              >
                {currentUser?.username || "User"}
              </Link>
              {/* Verified badge */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#2563eb"/>
                <path d="M7 13l3 3 7-7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {currentUser?.email || ""}
            </p>
          </div>

        </div>

        {/* ── Caption ── */}
        <div className="px-6 pt-2 pb-3">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={`What's on your mind, ${currentUser?.username || "there"}?`}
            className="w-full border-none resize-none text-gray-800 text-base placeholder-gray-400 leading-relaxed bg-transparent focus:outline-none"
            rows={3}
          />
        </div>

        {/* ── Image area ── */}
        <div className="px-6 pb-6">
          {!preview ? (
            <label className="cp-upload flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl h-56 cursor-pointer">
              <div className="cp-upload-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: "linear-gradient(135deg,#dbeafe,#ede9fe)" }}>
                <ImagePlus size={26} className="text-blue-500" />
              </div>
              <p className="text-sm font-medium text-gray-500">Click to upload a photo</p>
              <p className="text-xs text-gray-300 mt-1">PNG, JPG, GIF up to 10MB</p>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          ) : (
            <div className="relative group rounded-xl overflow-hidden" style={{ height: "300px" }}>
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
              <button
                onClick={removeImage}
                className="absolute top-2.5 right-2.5 bg-black bg-opacity-55 hover:bg-opacity-75 text-white p-1.5 rounded-full transition-all"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default CreatePost;