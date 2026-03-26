import API from "./api";


// ================================
// GET USER PROFILE
// ================================
export const getUserProfile = async (userId) => {
  const res = await API.get(`/v1/user/${userId}`);
  return res.data;
};


// ================================
// UPDATE USER PROFILE
// ================================
// Accepts FormData (username, bio, profilePic)
export const updateUserProfile = async (formData) => {
  const res = await API.put("/v1/user/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};


// ================================
// FOLLOW / UNFOLLOW USER
// ================================
export const followUnfollowUser = async (userId) => {
  const res = await API.put(`/v1/user/follow/${userId}`);
  return res.data;
};


// ================================
// GET FOLLOWERS & FOLLOWING
// ================================
export const getUserConnections = async (userId) => {
  const res = await API.get(`/v1/user/connections/${userId}`);
  return res.data;
};


// ================================
// DELETE USER PROFILE
// ================================
export const deleteUserProfile = async () => {
  const res = await API.delete("/v1/user/delete");
  return res.data;
};