import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

import { 
  FiHome, 
  FiMessageCircle, 
  FiBell, 
  FiUser,
  FiInstagram,
  FiLogOut,
  FiPlusSquare
} from "react-icons/fi";

function Sidebar() {

//   const { logout } = useContext(AuthContext);

  return (
    <>
      {/* DESKTOP SIDEBAR */}

      <div className="hidden md:flex fixed left-0 top-0 h-screen w-20 bg-white border-r flex-col items-center py-6 space-y-10">

        <Link to="/">
          <FiInstagram className="text-3xl cursor-pointer" />
        </Link>

        {/* <Link to="/">
          <FiHome className="text-2xl hover:scale-110 transition" />
        </Link> */}

        <Link to="/notifications">
          <FiBell className="text-2xl hover:scale-110 transition" />
        </Link>

        <Link to="/create">
          <FiPlusSquare className="text-2xl hover:scale-110 transition" />
        </Link>

        <Link to="/chat">
          <FiMessageCircle className="text-2xl hover:scale-110 transition" />
        </Link>

        <Link to="/profile/me">
          <FiUser className="text-2xl hover:scale-110 transition" />
        </Link>

        {/* <button onClick={logout}>
          <FiLogOut className="text-2xl hover:scale-110 transition" />
        </button> */}

      </div>


      {/* MOBILE BOTTOM NAVBAR */}

      <div className="fixed bottom-0 left-0 w-full bg-white border-t flex justify-around py-3 text-xl md:hidden">

        <Link to="/">
          <FiInstagram />
        </Link>

        <Link to="/notifications">
          <FiBell />
        </Link>

        <Link to="/create">
          <FiPlusSquare />
        </Link>

        <Link to="/chat">
          <FiMessageCircle />
        </Link>

        <Link to="/profile/me">
          <FiUser />
        </Link>

      </div>
    </>
  );
}

export default Sidebar;