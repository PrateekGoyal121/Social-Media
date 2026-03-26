import API from "./api";

// create post
export const createPost = async (data) => {
  const res = await API.post("/v1/post/", data);
  return res.data;
};

// get feed posts
export const getFeedPosts = async () => {
  const res = await API.get("/v1/post/feed");
  return res.data;
};

// get feed posts
export const getAllPosts = async () => {
  const res = await API.get("/v1/post/feed/all");
  return res.data;
};

// get user posts
export const getUserPosts = async (userId) => {
  const res = await API.get(`/v1/post/user/${userId}`);
  return res.data;
};

// like / unlike post
export const toggleLike = async (postId) => {
  const res = await API.put(`/v1/post/${postId}/like`);
  return res.data;
};

// delete post
export const deletePost = async (postId) => {
  const res = await API.delete(`/v1/post/${postId}`);
  return res.data;
};

// add comment
export const addComment = async (postId, text) => {
  const res = await API.post(`/v1/post/comment/${postId}`, { text });
  return res.data;
};

// delete comment
export const deleteComment = async (commentId) => {
  const res = await API.delete(`/v1/post/delete/${commentId}`);
  return res.data;
};

// get feed posts
export const getPostComments = async (postId) => {
  const res = await API.get(`/v1/post/${postId}/getcomments`);
  return res.data;
};

export const toggleSavePost = async (postId) => {
  const res = await API.put(`/v1/post/${postId}/save`);
  return res.data;
};
 
// get all saved posts of current user
export const getSavedPosts = async () => {
  const res = await API.get("/v1/post/saved");
  return res.data;
};

export const searchUsers = async (username) => {
  const res = await API.get(`/v1/post/search?username=${encodeURIComponent(username)}`);
  return res.data;
};

// ── USERS ─────────────────────────────────────────────────────────────────────

export const getSuggestedUsers = async () => {
  const res = await API.get('/v1/post/suggestions/users');
  return res.data;
};