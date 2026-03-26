import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user,setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const [token,setToken] = useState(
    localStorage.getItem("token") || null
  );

  const login = (userData, tokenData) => {

    localStorage.setItem("user",JSON.stringify(userData));
    localStorage.setItem("token",tokenData);

    localStorage.setItem("userId",userData._id);
    setUser(userData);
    setToken(tokenData);
  };

  const logout = () => {

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setUser(null);
    setToken(null);
  };

  // 🔥🔥🔥 MOST IMPORTANT FUNCTION
  // Used when profile updates, follow/unfollow etc
  const updateUser = (updatedUser) => {
    localStorage.setItem(
      "user",
      JSON.stringify(updatedUser)
    );
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{user,token,login,logout,updateUser}}>
      {children}
    </AuthContext.Provider>
  );
};