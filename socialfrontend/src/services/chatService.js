import API from "./api";

export const sendMessage = async ({ receiverId, text }) => {
  try {
    const res = await API.post("/v1/chat/send", { receiverId, text });
    return res.data;
  } catch (err) {
    console.error("sendMessage:", err.response?.data || err.message);
    return null;
  }
};

// Uploads image to backend, then sends a message whose text is JSON:
// { imageUrl: "https://res.cloudinary.com/...", caption: "optional caption" }
// ChatBubble parses this JSON and renders image + caption together.
export const sendImageMessage = async ({ receiverId, file, caption = "" }) => {
  try {
    const form = new FormData();
    form.append("imageFile",  file);
    form.append("receiverId", receiverId);
    form.append("caption",    caption);
    const res = await API.post("/v1/chat/send-image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    console.error("sendImageMessage:", err.response?.data || err.message);
    return null;
  }
};

export const getChat = async (userId) => {
  try {
    const res = await API.get(`/v1/chat/${userId}`);
    return res.data;
  } catch (err) {
    console.error("getChat:", err.response?.data || err.message);
    return null;
  }
};

export const getChatList = async () => {
  try {
    const res = await API.get("/v1/chat/");
    return res.data;
  } catch (err) {
    console.error("getChatList:", err.response?.data || err.message);
    return null;
  }
};

export const markAsRead = async (senderId) => {
  try {
    const res = await API.put("/v1/chat/read", { senderId });
    return res.data;
  } catch (err) {
    console.error("markAsRead:", err.response?.data || err.message);
    return null;
  }
};

export const deleteChat = async (userId) => {
  try {
    const res = await API.delete(`/v1/chat/delete/${userId}`);
    return res.data;
  } catch (err) {
    console.error("deleteChat:", err.response?.data || err.message);
    return null;
  }
};