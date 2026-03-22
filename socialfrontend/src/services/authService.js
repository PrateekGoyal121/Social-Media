import API from "./api";

// signup
export const signupUser = async (data) => {
  const res = await API.post("/v1/signup", data);
  return res.data;
};

// login
export const loginUser = async (data) => {
  const res = await API.post("/v1/login", data);
  return res.data;
};