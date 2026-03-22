import { Routes,Route,Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile"; 
import Chat from "./pages/Chat";
import Sidebar from "./components/Sidebar";
import Notifications from "./pages/Notifications";
import CreatePost from "./pages/CreatePost";

function App(){

  const {user} = useContext(AuthContext);

  if(!user){

    return(

      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="*" element={<Navigate to="/login"/>}/>
      </Routes>

    )

  }

  return(

    <div className="flex h-screen">

      <Sidebar/>


      <div className="flex-1 md:ml-20 pb-20 md:pb-0 p-6">

        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/profile/:id" element={<Profile/>}/>
          <Route
            path="/edit-profile"
            element={<EditProfile />}
          />

          {/* Redirect unknown routes */}
          <Route path="/create" element={<CreatePost/>} />
          
           <Route path="/chat" element={<Chat/>}/>
          <Route path="/notifications" element={<Notifications/>}/> 
        </Routes>

      </div>

    </div>

  )

}

export default App