import API from "./api";

export const getNotifications = async () => {
  const res = await API.get("/v1/notify");
  return res.data;
};

export const markAsRead = async (id) => {
  const res = await API.put(`/v1/notify/read/${id}`);
  return res.data;
};

export const markAllAsRead = async () => {
  const res = await API.put("/v1/notify/read-all");
  return res.data;
};

export const deleteNotification = async (id) => {
  const res = await API.delete(`/v1/notify/${id}`);
  return res.data;
};