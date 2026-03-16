import axios from "axios";

// backend base URL
const API = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true
});

// attach token automatically
API.interceptors.request.use((req) => {

  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

export default API;