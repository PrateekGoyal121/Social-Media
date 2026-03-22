import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { updateUserProfile } from "../services/userService";
import { AuthContext } from "../context/AuthContext";

import toast, { Toaster } from "react-hot-toast";

import {
  FaUser,
  FaInfoCircle,
  FaCamera,
  FaSave,
} from "react-icons/fa";

function EditProfile() {

  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || "");
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(user.profilePic);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProfilePic(file);

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", username);
    formData.append("bio", bio);

    if (profilePic) {
      formData.append("profilePic", profilePic);
    }

    try {
      const data = await updateUserProfile(formData);

      updateUser(data.user);

      toast.success("Profile updated");

      setTimeout(() => {
        navigate(`/profile/${data.user._id}`);
      }, 800);

    } catch (err) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <Toaster position="top-right" />

      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8">

        {/* 🔷 Header */}
        <h2 className="text-3xl font-bold text-center mb-8">
          Edit Profile
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* 📷 Profile Picture */}
          <div className="flex flex-col items-center gap-3">

            <div className="relative">

              <img
                src={preview}
                alt=""
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow"
              />

              {/* Camera Icon Overlay */}
              <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow hover:bg-blue-700 transition">
                <FaCamera />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-sm text-gray-500">
              Click camera icon to change photo
            </p>
          </div>

          {/* 👤 Username */}
          <div>
            <label className="flex items-center gap-2 font-medium mb-1">
              <FaUser className="text-blue-600" />
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Enter username"
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 📝 Bio */}
          <div>
            <label className="flex items-center gap-2 font-medium mb-1">
              <FaInfoCircle className="text-blue-600" />
              Bio
            </label>

            <textarea
              value={bio}
              onChange={(e) =>
                setBio(e.target.value)
              }
              placeholder="Tell something about yourself"
              rows="4"
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 💾 Save Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow"
          >
            <FaSave />
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;